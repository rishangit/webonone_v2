package expo.modules.smssender

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native SMS gateway sender for Android. Bridges SmsManager + SubscriptionManager
 * so the JS layer can list SIM slots and send messages via a chosen subscription.
 */
class SmsSenderModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext) { "React context unavailable" }

  override fun definition() = ModuleDefinition {
    Name("SmsSender")

    Function("isSupported") { true }

    AsyncFunction("hasSendSmsPermission") { promise: Promise ->
      promise.resolve(hasPermission(Manifest.permission.SEND_SMS))
    }

    AsyncFunction("requestSendSmsPermission") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(hasPermission(Manifest.permission.SEND_SMS))
        return@AsyncFunction
      }
      if (hasPermission(Manifest.permission.SEND_SMS)) {
        promise.resolve(true)
        return@AsyncFunction
      }
      // Delegate the runtime request; the JS layer re-checks on resume.
      activity.requestPermissions(
        arrayOf(Manifest.permission.SEND_SMS, Manifest.permission.READ_PHONE_STATE),
        REQUEST_CODE,
      )
      promise.resolve(false)
    }

    AsyncFunction("getSimSlots") { promise: Promise ->
      promise.resolve(readSimSlots())
    }

    AsyncFunction("sendSms") { toNumber: String, body: String, subscriptionId: Int?, promise: Promise ->
      try {
        val manager = smsManagerFor(subscriptionId)
        val parts = manager.divideMessage(body)
        manager.sendMultipartTextMessage(toNumber, null, parts, null, null)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject(CodedException("SEND_FAILED", e.message ?: "Failed to send SMS", e))
      }
    }
  }

  private fun hasPermission(permission: String): Boolean =
    ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

  private fun readSimSlots(): List<Map<String, Any?>> {
    if (!hasPermission(Manifest.permission.READ_PHONE_STATE)) return emptyList()
    val subs = context.getSystemService(SubscriptionManager::class.java) ?: return emptyList()
    val active = subs.activeSubscriptionInfoList ?: return emptyList()
    return active.map { info ->
      mapOf(
        "slot" to info.simSlotIndex,
        "subscriptionId" to info.subscriptionId,
        "carrier" to info.carrierName?.toString(),
        "number" to info.number,
      )
    }
  }

  private fun smsManagerFor(subscriptionId: Int?): SmsManager {
    if (subscriptionId == null || subscriptionId < 0) {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(SmsManager::class.java)
      } else {
        @Suppress("DEPRECATION")
        SmsManager.getDefault()
      }
    }
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(SmsManager::class.java).createForSubscriptionId(subscriptionId)
    } else {
      @Suppress("DEPRECATION")
      SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
    }
  }

  companion object {
    private const val REQUEST_CODE = 4016
  }
}
