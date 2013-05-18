namespace cpp telescope.thrift
namespace java telescope.thrift


enum FlapEnum {
  UNKNOWN,
  FLAPPING,
  NOFLAP,
}

enum AlarmState {
  UNKNOWN = -1,
  OK = 1,
  WARNING = 2,
  CRITICAL = 6
}

enum Result
{
  FAILED,
  OK,
}

enum CollectorState {
  UP,
  DOWN,
}

enum VerificationModel {
  ONE,
  QUORUM,
  ALL,
}

exception InvalidQueryException {
  1: string why,
}

exception AlarmNotFoundException {
  1: string why,
}

struct Metric
{
  1: byte metricType,
  2: optional double valueDbl,
  3: optional i64 valueI64,
  4: optional i32 valueI32,
  5: optional string valueStr,
}

struct CorrelatedStatus
{
  1: string id,
  2: string collector,
  3: AlarmState criteriaState,
  4: string status,
  5: CollectorState state,
}

struct Telescope
{
  1: string id,
  2: string checkId,
  3: string acctId,
  4: string checkModule,
  5: string entityId,
  6: string target,
  7: i64 timestamp,
  8: i32 consecutiveTrigger = 1,
  9: VerificationModel verifyModel,
  10: optional string analyzedByMonitoringZoneId,
  11: optional map<string, string> dimensions,
  12: optional map<string, Metric> metrics,
  14: optional string dimensionKey;
  15: optional string collector;
  16: optional FlapEnum flapEnum = FlapEnum.UNKNOWN
  17: optional AlarmState criteriaState
  18: optional AlarmState computedState
  19: optional string alarmId
  20: optional byte availability
  21: optional byte state
  22: optional string status
  23: optional list<CorrelatedStatus> correlatedStatuses
  24: optional string monitoringZoneId
  25: optional string txnId
  26: optional string checkType
  27: optional AlarmState previousKnownState,
  28: optional list<string> collectorKeys,
}

struct RepeatEvent
{
  1: string alarmId,
}

struct CollectorEvent
{
  1: string collector,
  2: i64 timestamp,
  3: CollectorState availability,
}

struct ConsecutiveTriggerEvent
{
  1: string alarmId,
  2: string checkId,
  3: string dimensionKey,
  4: string monitoringZoneId,
  5: i64 timestamp,
  6: AlarmState criteriaState,
  7: i32 consecutiveEvents = 0,
}

struct CollectorTimeout
{
  1: i64 timeout,
}

/* Remove the boundcheck 'id' from checks */
struct RemoveBoundCheck
{
  1: string checkId,
  2: string monitoringZoneId
}

struct MinimalState
{
  1: string alarmId,
  2: string dimensionKey,
  3: string checkId,
  4: AlarmState computedState,
  5: i64 timestamp,
}

struct FlapState
{
  1: string alarmId,
  2: string dimensionKey,
  3: string checkId,
  4: double flapCalc,
  5: FlapEnum flapEnum,
}

struct ConditionState
{
  1: AlarmState state,
  2: string message,
}

/* Made as a struct with optional fields.  Because Thrift unions in 2011
   is about as uncertain as C++ Templates in 1999. */
/* This represents a telescope or a removed boundcheck so that you can pass
   the CEP a list of indeterminate types from the stratcon */
struct TelescopeOrRemove
{
  1: optional Telescope telescope,
  2: optional RemoveBoundCheck bc,
}

service TelescopeServer
{
  /* Publish a list of Telescope structs to the EventEngine. */
  void Publish(1: list<Telescope> messages);

  /* Publish a list of RepeatEvents (which cause the last event with the
     specified alarmId to be repeated) to the EventEngine. */
  void RepeatEvents(1: list<RepeatEvent> repeatEvents);

  /* Publish a list of RemoveBoundChecks (which cause the bound check with
     the specified id to be removed) to the EventEngine. */
  void RemoveBoundChecks(1: list<RemoveBoundCheck> removeBoundChecks);

  /* Publish a CollectorTimeout (which changes the amount of time before a
     collector is marked inactive) to the EventEngine. */
  void UpdateCollectorTimeout(1: CollectorTimeout timeout);

  /* Test compile an EPL query. The transaction ID is used for error logging.
     If a compilation error occurs an InvalidQueryException is thrown. */
  void TestCompileAlarm(1: string txnId, 2: string query) throws (1: InvalidQueryException iqe);

  /* Add an EPL query for the specified alarmId. If a compilation error occurs
     an InvalidQueryException is thrown.*/
  void AddAlarm(1: string alarmId, 2: string query) throws (1: InvalidQueryException iqe);

  /* Remove the query that was added for the specified alarmId. If no such
     query is registered an AlarmNotFoundException is thrown. */
  void RemoveAlarm(1: string alarmId) throws (1: AlarmNotFoundException qnfe);

  /* Retrieve the query that was added for the specified alarmId. If no such
     query is registered an AlarmNotFoundException is thrown. */
  string GetAlarm(1: string alarmId) throws (1: AlarmNotFoundException qnfe);
}

service TelescopeTestServer
{
  /* Test compile run an alarm against a list of data. The transaction ID is used for error logging.
     If a compilation error occurs an InvalidQueryException is thrown. */
  list<Telescope> TestRunAlarm(1: string txnId, 2: string query, 3: list<Telescope> messages) throws (1: InvalidQueryException iqe);
}
