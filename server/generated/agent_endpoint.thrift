include "agent_common.thrift"

service AgentPoint {
  /**
   * Disconnect the agent and remove the connection.
   * Used for example when user removes a token.
   */
  bool DisconnectAgent(1: agent_common.Context ctx, 2: string agentId),

  /*
   * Retrieve system info for an agent
   */
  map<string, string> GetSystemInfo(1: agent_common.Context ctx, 2: string agentId, 3: string Resource)
}
