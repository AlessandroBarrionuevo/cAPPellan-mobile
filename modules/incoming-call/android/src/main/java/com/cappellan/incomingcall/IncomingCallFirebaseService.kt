// [ROLLBACK-POINT-FULLSCREEN-INTENT-SERVICE-START]
// Native FirebaseMessagingService that intercepts INCOMING_CALL and displays a FullScreenIntent notification
// over the lock screen without relying on JavaScript/Hermes waking up.
// TO ROLLBACK: Delete this file and remove its service declaration from modules/incoming-call/android/src/main/AndroidManifest.xml
package com.cappellan.incomingcall

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class IncomingCallFirebaseService : FirebaseMessagingService() {

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    val type = data["type"]

    if (type == "INCOMING_CALL") {
      handleIncomingCall(data)
    } else if (type == "CANCEL_CALL") {
      val sessionId = data["sessionId"]?.toIntOrNull() ?: 1001
      NotificationManagerCompat.from(this).cancel(sessionId)
      forwardToExpoNotifications(remoteMessage)
    } else {
      forwardToExpoNotifications(remoteMessage)
    }
  }

  private fun handleIncomingCall(data: Map<String, String>) {
    val sessionId = data["sessionId"]?.toIntOrNull() ?: 1001
    val callerName = data["callerName"] ?: "Guardia Pastoral"
    val sessionType = data["sessionType"] ?: "VIDEO"
    val token = data["token"]
    val livekitRoom = data["livekitRoom"]

    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
              Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra("sessionId", sessionId.toString())
      putExtra("callerName", callerName)
      putExtra("sessionType", sessionType)
      putExtra("type", "INCOMING_CALL")
      if (token != null) putExtra("token", token)
      if (livekitRoom != null) putExtra("livekitRoom", livekitRoom)
    }

    val fullScreenPendingIntent = PendingIntent.getActivity(
      this,
      sessionId,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    )

    val acceptIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
              Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
              Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra("sessionId", sessionId.toString())
      putExtra("callerName", callerName)
      putExtra("sessionType", sessionType)
      putExtra("type", "INCOMING_CALL")
      putExtra("action", "ACCEPT")
      if (token != null) putExtra("token", token)
      if (livekitRoom != null) putExtra("livekitRoom", livekitRoom)
    }

    val acceptPendingIntent = PendingIntent.getActivity(
      this,
      sessionId * 10 + 1,
      acceptIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    )

    val rejectIntent = Intent(this, IncomingCallActionReceiver::class.java).apply {
      putExtra("sessionId", sessionId)
    }

    val rejectPendingIntent = PendingIntent.getBroadcast(
      this,
      sessionId * 10 + 2,
      rejectIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    )

    val channelId = "incoming-calls-v3"
    val isChat = sessionType == "CHAT"
    val title = if (isChat) "💬 Solicitud de Chat Pastoral" else "📞 Llamada de Guardia Entrante"
    val body = "$callerName solicita atención inmediata"

    val soundUri = Uri.parse("android.resource://$packageName/raw/incoming_call")

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
      if (notificationManager != null && notificationManager.getNotificationChannel(channelId) == null) {
        val channel = android.app.NotificationChannel(
          channelId,
          "Llamadas Entrantes",
          android.app.NotificationManager.IMPORTANCE_HIGH
        ).apply {
          description = "Notificaciones prioritarias de llamadas de guardia con pantalla completa"
          enableLights(true)
          enableVibration(true)
          vibrationPattern = longArrayOf(0, 1000, 500, 1000)
          lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
          setBypassDnd(true)
          val audioAttributes = android.media.AudioAttributes.Builder()
            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .build()
          setSound(soundUri, audioAttributes)
        }
        notificationManager.createNotificationChannel(channel)
      }
    }

    val person = androidx.core.app.Person.Builder()
      .setName(callerName)
      .setImportant(true)
      .build()

    val notificationBuilder = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(
        resources.getIdentifier("notification_icon", "drawable", packageName).takeIf { it != 0 }
          ?: applicationInfo.icon
      )
      .setContentTitle(title)
      .setContentText(body)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setSound(soundUri)
      .setContentIntent(fullScreenPendingIntent)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .setStyle(
        NotificationCompat.CallStyle.forIncomingCall(
          person,
          rejectPendingIntent,
          acceptPendingIntent
        )
      )
      .addAction(
        android.R.drawable.ic_menu_close_clear_cancel,
        "Rechazar",
        rejectPendingIntent
      )
      .addAction(
        android.R.drawable.ic_menu_call,
        "Atender",
        acceptPendingIntent
      )

    NotificationManagerCompat.from(this).notify(sessionId, notificationBuilder.build())
  }

  private fun forwardToExpoNotifications(remoteMessage: RemoteMessage) {
    try {
      val delegateClass = Class.forName("expo.modules.notifications.service.delegates.FirebaseMessagingDelegate")
      val constructor = delegateClass.getConstructor(Context::class.java)
      val delegate = constructor.newInstance(this)
      val method = delegateClass.getMethod("onMessageReceived", RemoteMessage::class.java)
      method.invoke(delegate, remoteMessage)
    } catch (_: Exception) {
    }
  }

  override fun onNewToken(token: String) {
    try {
      val delegateClass = Class.forName("expo.modules.notifications.service.delegates.FirebaseMessagingDelegate")
      val constructor = delegateClass.getConstructor(Context::class.java)
      val delegate = constructor.newInstance(this)
      val method = delegateClass.getMethod("onNewToken", String::class.java)
      method.invoke(delegate, token)
    } catch (_: Exception) {
    }
  }

  override fun onDeletedMessages() {
    try {
      val delegateClass = Class.forName("expo.modules.notifications.service.delegates.FirebaseMessagingDelegate")
      val constructor = delegateClass.getConstructor(Context::class.java)
      val delegate = constructor.newInstance(this)
      val method = delegateClass.getMethod("onDeletedMessages")
      method.invoke(delegate)
    } catch (_: Exception) {
    }
  }
}
// [ROLLBACK-POINT-FULLSCREEN-INTENT-SERVICE-END]
