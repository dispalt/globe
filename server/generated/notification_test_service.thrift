include "agent_common.thrift"
include "fb303.thrift"

struct NotificationTestResult {
  1: string status,
  2: string message
}

service notificationTestService extends fb303.FacebookService {
  NotificationTestResult TestNotification(1: agent_common.Context ctx, 2: string type, 3: map<string, string> details)
}
