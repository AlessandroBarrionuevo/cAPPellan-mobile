package com.cappellan.incomingcall

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import java.net.HttpURLConnection
import java.net.URL

/**
 * Receiver for dismissing incoming call notifications and notifying the Spring Boot backend
 * when the user taps "Descartar" / "Rechazar" / "Cancelar".
 */
class IncomingCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    Log.d("IncomingCallAction", "IncomingCallActionReceiver received intent: ${intent.action}")

    val sessionId = intent.getIntExtra("sessionId", -1).takeIf { it != -1 }
      ?: intent.getStringExtra("sessionId")?.toIntOrNull()
      ?: 1001

    // 1. Immediately cancel all incoming call notifications
    try {
      val nm = NotificationManagerCompat.from(context)
      nm.cancel(sessionId)
      nm.cancel(1001)
    } catch (e: Exception) {
      Log.w("IncomingCallAction", "Error cancelling notification", e)
    }

    // 2. Immediately stop device vibration natively
    try {
      val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? android.os.VibratorManager
        vm?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
      }
      vibrator?.cancel()
    } catch (e: Exception) {
      Log.w("IncomingCallAction", "Error cancelling vibrator", e)
    }

    // 3. Immediately notify the Spring Boot backend via direct async HTTP POST
    val prefs = context.getSharedPreferences("IncomingCallAuth", Context.MODE_PRIVATE)
    val authToken = prefs.getString("authToken", null)
    val apiBaseUrl = prefs.getString("apiBaseUrl", null) ?: "https://jones-benefits-pct-groups.trycloudflare.com"

    Thread {
      try {
        val url = URL("$apiBaseUrl/calls/$sessionId/end")
        Log.d("IncomingCallAction", "Sending backend endCall POST -> $url")
        val conn = (url.openConnection() as HttpURLConnection).apply {
          requestMethod = "POST"
          connectTimeout = 8000
          readTimeout = 8000
          setRequestProperty("Content-Type", "application/json")
          if (!authToken.isNullOrBlank()) {
            val headerVal = if (authToken.startsWith("Bearer ")) authToken else "Bearer $authToken"
            setRequestProperty("Authorization", headerVal)
          }
        }
        val responseCode = conn.responseCode
        Log.d("IncomingCallAction", "Backend endCall POST response code: $responseCode")
        conn.disconnect()
      } catch (e: Exception) {
        Log.w("IncomingCallAction", "Failed to send endCall to backend", e)
      }
    }.start()

    // 4. Notify React Native module and record last rejected sessionId
    IncomingCallModule.notifyCallRejected(sessionId)
  }
}
