package com.cappellan.incomingcall

import android.app.KeyguardManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class IncomingCallModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React application context lost")

  companion object {
    @Volatile
    var instance: IncomingCallModule? = null

    @Volatile
    var lastRejectedSessionId: Int? = null

    fun notifyCallRejected(sessionId: Int) {
      lastRejectedSessionId = sessionId
      instance?.let { module ->
        try {
          module.sendEvent("onIncomingCallRejected", mapOf("sessionId" to sessionId))
        } catch (e: Exception) {
          android.util.Log.w("IncomingCallModule", "Failed to send onIncomingCallRejected event", e)
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("IncomingCall")

    Events("onIncomingCallRejected")

    OnCreate {
      instance = this@IncomingCallModule
    }

    OnDestroy {
      if (instance == this@IncomingCallModule) {
        instance = null
      }
    }

    Function("getInitialCallData") {
      val intent = appContext.currentActivity?.intent ?: return@Function null
      val type = intent.getStringExtra("type") ?: return@Function null
      if (type != "INCOMING_CALL") return@Function null

      val data = mapOf(
        "sessionId" to intent.getStringExtra("sessionId"),
        "callerName" to intent.getStringExtra("callerName"),
        "sessionType" to intent.getStringExtra("sessionType"),
        "token" to intent.getStringExtra("token"),
        "livekitRoom" to intent.getStringExtra("livekitRoom"),
        "action" to intent.getStringExtra("action")
      )
      // Clear the type so subsequent checks do not re-trigger
      intent.removeExtra("type")
      data
    }

    Function("clearInitialCallData") {
      appContext.currentActivity?.intent?.removeExtra("type")
    }

    Function("consumeLastRejectedSessionId") {
      val id = lastRejectedSessionId
      lastRejectedSessionId = null
      id
    }

    Function("setAuthContext") { token: String?, baseUrl: String?, role: String? ->
      try {
        val prefs = context.getSharedPreferences("IncomingCallAuth", Context.MODE_PRIVATE)
        prefs.edit().apply {
          putString("authToken", token)
          if (!baseUrl.isNullOrBlank()) {
            putString("apiBaseUrl", baseUrl)
          }
          putString("userRole", role)
          apply()
        }
      } catch (e: Exception) {
        android.util.Log.w("IncomingCallModule", "Failed to save auth context", e)
      }
    }

    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        notificationManager?.canUseFullScreenIntent() ?: true
      } else {
        true
      }
    }

    Function("openFullScreenIntentSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
          data = Uri.parse("package:${context.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
      }
    }

    Function("turnScreenOnAndDismissKeyguard") {
      appContext.currentActivity?.let { activity ->
        activity.runOnUiThread {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            activity.setShowWhenLocked(true)
            activity.setTurnScreenOn(true)
            val km = activity.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            km?.requestDismissKeyguard(activity, null)
          } else {
            @Suppress("DEPRECATION")
            activity.window.addFlags(
              WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
              WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
          }
        }
      }
    }

    Function("displayIncomingCall") { options: Map<String, Any?> ->
      try {
        val prefs = context.getSharedPreferences("IncomingCallAuth", Context.MODE_PRIVATE)
        val role = prefs.getString("userRole", null)
        val isStaff = role == "CHAPLAIN" || role == "CHAPLAIN_LEADER" || role == "CHAPLAIN_CONTENT_LEADER" || role == "SUPERUSER"
        if (!isStaff) {
          android.util.Log.w("IncomingCallModule", "Ignoring displayIncomingCall: current role is '$role' (not chaplain staff)")
          return@Function false
        }

        val sessionId = (options["sessionId"] as? Number)?.toInt() ?: 1001
        val callerName = options["callerName"] as? String ?: "Guardia Pastoral"
        val sessionType = options["sessionType"] as? String ?: "VIDEO"
        val token = options["token"] as? String
        val livekitRoom = options["livekitRoom"] as? String

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
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
          context,
          sessionId,
          launchIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val acceptIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
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
          context,
          sessionId * 10 + 1,
          acceptIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val rejectIntent = Intent(context, IncomingCallActionReceiver::class.java).apply {
          action = "com.cappellan.incomingcall.ACTION_REJECT"
          setPackage(context.packageName)
          putExtra("sessionId", sessionId)
          if (token != null) putExtra("token", token)
        }

        val rejectPendingIntent = PendingIntent.getBroadcast(
          context,
          sessionId * 10 + 2,
          rejectIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val channelId = "incoming-calls-v3"
        val isChat = sessionType == "CHAT"
        val title = if (isChat) "💬 Solicitud de Chat Pastoral" else "📞 Llamada de Guardia Entrante"
        val body = "$callerName solicita atención inmediata"

        val person = Person.Builder()
          .setName(callerName)
          .setImportant(true)
          .build()

        val notificationBuilder = NotificationCompat.Builder(context, channelId)
          .setSmallIcon(context.resources.getIdentifier("notification_icon", "drawable", context.packageName).takeIf { it != 0 }
            ?: context.applicationInfo.icon)
          .setContentTitle(title)
          .setContentText(body)
          .setPriority(NotificationCompat.PRIORITY_MAX)
          .setCategory(NotificationCompat.CATEGORY_CALL)
          .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
          .setOngoing(true)
          .setAutoCancel(true)
          .setContentIntent(fullScreenPendingIntent)
          .setFullScreenIntent(fullScreenPendingIntent, true)
          .setStyle(
            NotificationCompat.CallStyle.forIncomingCall(
              person,
              rejectPendingIntent,
              acceptPendingIntent
            )
          )

        NotificationManagerCompat.from(context).notify(sessionId, notificationBuilder.build())
        true
      } catch (e: Exception) {
        false
      }
    }

    Function("dismissIncomingCall") { sessionId: Int ->
      try {
        val nm = NotificationManagerCompat.from(context)
        nm.cancel(sessionId)
        nm.cancel(1001)

        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? android.os.VibratorManager
          vm?.defaultVibrator
        } else {
          @Suppress("DEPRECATION")
          context.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
        }
        vibrator?.cancel()
      } catch (_: Exception) {
      }
    }
  }
}
