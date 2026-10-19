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
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class IncomingCallModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React application context lost")

  override fun definition() = ModuleDefinition {
    Name("IncomingCall")

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

        val channelId = "incoming-calls-v3"
        val isChat = sessionType == "CHAT"
        val title = if (isChat) "Solicitud de Chat Pastoral" else "Llamada de Guardia Pastoral"
        val body = "$callerName solicita atención inmediata"

        val notificationBuilder = NotificationCompat.Builder(context, channelId)
          .setSmallIcon(context.resources.getIdentifier("notification_icon", "drawable", context.packageName).takeIf { it != 0 }
            ?: context.applicationInfo.icon)
          .setContentTitle(title)
          .setContentText(body)
          .setPriority(NotificationCompat.PRIORITY_MAX)
          .setCategory(NotificationCompat.CATEGORY_CALL)
          .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
          .setOngoing(true)
          .setAutoCancel(false)
          .setContentIntent(fullScreenPendingIntent)
          .setFullScreenIntent(fullScreenPendingIntent, true)

        NotificationManagerCompat.from(context).notify(sessionId, notificationBuilder.build())
        true
      } catch (e: Exception) {
        false
      }
    }

    Function("dismissIncomingCall") { sessionId: Int ->
      try {
        NotificationManagerCompat.from(context).cancel(sessionId)
      } catch (_: Exception) {
      }
    }
  }
}
