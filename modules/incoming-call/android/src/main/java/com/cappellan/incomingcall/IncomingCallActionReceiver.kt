package com.cappellan.incomingcall

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat

/**
 * Receiver for dismissing incoming call notifications when the user taps "Rechazar" (Decline).
 */
class IncomingCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val sessionId = intent.getIntExtra("sessionId", 1001)
    NotificationManagerCompat.from(context).cancel(sessionId)
  }
}
