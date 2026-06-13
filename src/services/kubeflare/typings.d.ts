// @ts-ignore
/* eslint-disable */

declare namespace API {
  type ApiResponse<T> = {
    code: number
    message: string
    data: T
    request_id?: string
  }

  type UserItem = {
    id: number
    legacy_id?: string
    username: string
    nickname: string
    email?: string
    phone?: string
    avatar?: string
    remarks?: string
    status: number
    mfa_enabled?: boolean
    create_time?: string
    update_time?: string
  }

  type CurrentUser = UserItem

  type AuthSession = {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    refresh_token_expires_in: number
    session_id: string
    user: CurrentUser
  }

  type LoginData = AuthSession

  type LoginParams = {
    username: string
    password: string
    captcha_id?: string
    captcha_code?: string
    otp_code?: string
  }

  type RefreshTokenParams = {
    refresh_token?: string
  }

  type LogoutParams = {
    refresh_token?: string
    all_sessions?: boolean
  }

  type CaptchaData = {
    id: string
    image_url: string
    expires_in: number
  }

  type UploadFileData = {
    id: string
    type: string
    filename: string
    original_name: string
    content_type: string
    size: number
    url: string
    created_at: string
  }

  type AiChatMessageRole = 'assistant' | 'system' | 'user'

  type AiChatMessageStatus =
    | 'completed'
    | 'failed'
    | 'pending'
    | 'streaming'

  type AiConnectionStatus =
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'failed'

  type AiConnectionStatusData = {
    status: AiConnectionStatus
    message?: string
    provider?: string
    model?: string
  }

  type AiChatSessionItem = {
    id: string
    user_id: string
    title: string
    summary?: string
    status: string
    created_at: string
    updated_at: string
    deleted_at?: string
  }

  type AiChatMessageItem = {
    id: string
    session_id: string
    role: AiChatMessageRole
    content: string
    content_type: string
    status: AiChatMessageStatus
    sequence: number
    provider?: string
    model?: string
    metadata?: AiChatMessageMetadata
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    error_message?: string
    created_at: string
    completed_at?: string
    deleted_at?: string
  }

  type AiChatMessageMetadata = {
    agent_run?: AiChatMessageAgentRunMetadata
  }

  type AiChatMessageAgentRunMetadata = {
    run?: AgentRun
    route?: AgentRouteResult
    tool_calls?: AgentToolCall[]
    evidences?: AgentEvidence[]
    feedback?: AgentRunFeedback
    status?: AgentRunStatus
    error_message?: string
  }

  type AiChatSessionDetail = AiChatSessionItem & {
    messages: AiChatMessageItem[]
  }

  type AiChatSessionListData = {
    items: AiChatSessionItem[]
  }

  type AiChatMessageListData = {
    items: AiChatMessageItem[]
  }

  type CreateAiChatSessionParams = {
    title?: string
  }

  type UpdateAiChatSessionParams = {
    title: string
    summary?: string
  }

  type CreateAiChatMessageParams = {
    content: string
  }

  type AgentType =
    | 'assistant'
    | 'auto'
    | 'capacity'
    | 'change_review'
    | 'cost'
    | 'diagnostic'
    | 'remediation'
    | 'security'
    | (string & {})

  type AgentRunStatus =
    | 'cancelled'
    | 'completed'
    | 'failed'
    | 'pending'
    | 'running'

  type AgentToolCallStatus = 'completed' | 'failed' | 'running'

  type AgentToolReadOnly = boolean

  type AgentToolSource = 'cluster' | 'monitoring' | string

  type AgentToolOrigin = 'builtin' | 'config' | 'mcp' | string

  type AgentDefinition = {
    type: AgentType
    name: string
    description: string
    version: string
    available: boolean
    capabilities?: string[] | null
    default_tools?: string[] | null
  }

  type AgentSkillDefinition = {
    id: string
    name: string
    description: string
    enabled: boolean
    agent_types?: AgentType[] | null
    triggers?: string[] | null
    system_prompt?: string
    allowed_tools?: string[] | null
    hints?: string[] | null
  }

  type AgentCandidate = {
    agent_type: AgentType
    name: string
    reason: string
    confidence: number
    available: boolean
  }

  type AgentRouteResult = {
    agent_type: AgentType
    confidence: number
    reason: string
    source?: string
    skill_id?: string
    need_confirm: boolean
    candidates: AgentCandidate[]
    alternatives?: AgentType[]
  }

  type AgentToolDefinition = {
    id: string
    name: string
    category: string
    description: string
    read_only: AgentToolReadOnly
    agent_types?: AgentType[] | null
    timeout_ms: number
    max_bytes: number
    observe_max_chars?: number
    source?: AgentToolSource
    origin?: AgentToolOrigin
    enabled: boolean
    overridden?: boolean
    parameters?: Record<string, any>
  }

  type AgentScope = {
    namespace?: string
    resource_kind?: string
    resource_name?: string
    container?: string
  }

  type AgentRun = {
    id: string
    agent_type: AgentType
    user_id: string
    cluster_id: string
    input: string
    scope?: AgentScope
    status: AgentRunStatus
    confidence: number
    route_reason: string
    route_source?: string
    summary: string
    error_message?: string
    heartbeat_at?: string
    lease_owner?: string
    lease_expires?: string
    created_at: string
    completed_at?: string
    deleted_at?: string
  }

  type AgentToolCall = {
    id: string
    run_id: string
    agent_type: AgentType
    tool_id: string
    input?: Record<string, any>
    output_summary?: string
    status: AgentToolCallStatus
    error_message?: string
    started_at: string
    completed_at?: string
    deleted_at?: string
  }

  type AgentEvidence = {
    id: string
    run_id: string
    tool_call_id: string
    source_kind: string
    api_group?: string
    api_version?: string
    resource_kind?: string
    namespace?: string
    name?: string
    resource_version?: string
    summary: string
    raw_json?: Record<string, any>
    hash?: string
    redacted: boolean
    collected_at: string
    deleted_at?: string
  }

  type AgentRunFeedback = {
    id: string
    run_id: string
    user_id: string
    agent_type: AgentType
    cluster_id: string
    useful: boolean
    comment?: string
    created_at: string
    updated_at: string
  }

  type AgentRunMetrics = {
    id: string
    run_id: string
    agent_type: AgentType
    cluster_id: string
    step_count: number
    tool_call_count: number
    token_used: number
    extra_token_used: number
    token_estimated: boolean
    reflection_count: number
    replan_count: number
    plan_generated: boolean
    reflection_jurors: number
    playbook_matched: boolean
    hypothesis_total: number
    hypothesis_resolved: number
    case_retrieval_mode?: string
    case_hit_count: number
    duration_ms: number
    status: AgentRunStatus
    created_at: string
  }

  type AgentRunListParams = {
    keyword?: string
    agent_type?: AgentType
    cluster_id?: string
    status?: AgentRunStatus
    user_id?: string
    days?: number
    current?: number
    pageSize?: number
  }

  type AgentRunListData = {
    items: AgentRun[]
    total: number
  }

  type AgentRunDetail = {
    run: AgentRun
    tool_calls: AgentToolCall[]
    evidences: AgentEvidence[]
    feedback?: AgentRunFeedback
    metrics?: AgentRunMetrics
  }

  type AgentRunMetricsSampleParams = {
    days?: number
    feature?: string
    enabled?: boolean
    agent_type?: AgentType
    cluster_id?: string
    current?: number
    pageSize?: number
  }

  type AgentRunMetricsSample = {
    run: AgentRun
    metrics?: AgentRunMetrics
    feedback?: AgentRunFeedback
  }

  type AgentRunMetricsSampleData = {
    items: AgentRunMetricsSample[]
    total: number
  }

  type AgentRuntimeFeatureStatus = {
    llm_routing: boolean
    stream_think: boolean
    planning: boolean
    reflection: boolean
    hypothesis_ledger: boolean
    playbook: boolean
    observe_compression: boolean
    case_library: boolean
    semantic_retrieval: boolean
    replanning: boolean
    route_learning: boolean
  }

  type AgentRuntimeLoopStatus = {
    max_steps: number
    max_token_budget: number
    max_tool_errors_per_step: number
    step_timeout_ms: number
    tool_choice: string
    max_reflection_steps: number
    max_reflections: number
    reflection_jurors: number
    case_few_shot_limit: number
    case_cache_size: number
    route_few_shot_limit: number
    route_cache_size: number
    replan_interval: number
    max_replans: number
  }

  type AgentRuntimeConcurrencyStatus = {
    max_concurrent_runs_per_user: number
    max_concurrent_runs: number
    distributed_semaphore: boolean
    instance_id?: string
  }

  type AgentRuntimeRepositoryStatus = {
    runtime_config: boolean
    route_feedback: boolean
    diagnosis_case: boolean
    run_metrics: boolean
    run_feedback: boolean
    embedding: boolean
  }

  type AgentRuntimeToolStatus = {
    total: number
    enabled: number
    disabled: number
    mcp: number
    prometheus: number
  }

  type AgentRuntimeSkillStatus = {
    total: number
    enabled: number
    disabled: number
  }

  type AgentRuntimeMCPServerStatus = {
    name: string
    transport: string
    state: 'disconnected' | 'connecting' | 'ready' | 'failed' | string
    ready: boolean
    tool_count: number
    trusted_tool_count: number
    max_concurrency: number
    health_interval_ms: number
    call_timeout_ms: number
  }

  type AgentRuntimePrometheusStatus = {
    enabled: boolean
    healthy?: boolean
    namespace?: string
    service?: string
    port?: string
    scheme?: string
    query_timeout_ms?: number
    tool_count: number
    latency_ms?: number
    last_error?: string
    last_checked_at?: string
  }

  type AgentRuntimeStatus = {
    features: AgentRuntimeFeatureStatus
    loop: AgentRuntimeLoopStatus
    concurrency: AgentRuntimeConcurrencyStatus
    repositories: AgentRuntimeRepositoryStatus
    tools: AgentRuntimeToolStatus
    skills: AgentRuntimeSkillStatus
    mcp_servers: AgentRuntimeMCPServerStatus[]
    prometheus: AgentRuntimePrometheusStatus
    runtime_version?: number
  }

  type AgentDiagnosisCase = {
    id: string
    run_id: string
    agent_type: AgentType
    cluster_id: string
    question: string
    symptom: string
    root_cause: string
    tags?: string[]
    tool_trace?: string[]
    created_at: string
  }

  type AgentDiagnosisCaseListParams = {
    keyword?: string
    agent_type?: AgentType
    cluster_id?: string
    current?: number
    pageSize?: number
  }

  type AgentDiagnosisCaseListData = {
    items: AgentDiagnosisCase[]
    total: number
  }

  type AgentRouteFeedback = {
    id: string
    user_id: string
    message: string
    routed_agent_type: AgentType
    routed_confidence: number
    selected_agent_type: AgentType
    matched: boolean
    created_at: string
  }

  type AgentRouteFeedbackListParams = {
    keyword?: string
    selected_agent_type?: AgentType
    matched?: boolean
    current?: number
    pageSize?: number
  }

  type AgentRouteFeedbackListData = {
    items: AgentRouteFeedback[]
    total: number
  }

  type SubmitAgentRunFeedbackParams = {
    useful: boolean
    comment?: string
  }

  type AgentRunMetricsEvaluationParams = {
    days?: number
    agent_type?: AgentType
    cluster_id?: string
  }

  type AgentFeatureBucket = {
    run_count: number
    feedback_count: number
    useful_count: number
    avg_step_count: number
    avg_tool_call_count: number
    avg_token_total: number
    avg_duration_ms: number
  }

  type AgentFeatureComparison = {
    on: AgentFeatureBucket
    off: AgentFeatureBucket
  }

  type AgentRunMetricsEvaluation = {
    window_days: number
    since: string
    overall: AgentFeatureBucket
    planning: AgentFeatureComparison
    reflection: AgentFeatureComparison
    replan: AgentFeatureComparison
    semantic_retrieval: AgentFeatureComparison
    case_hit: AgentFeatureComparison
  }

  type AgentListData = {
    items: AgentDefinition[]
  }

  type AgentToolListData = {
    items: AgentToolDefinition[]
  }

  type AgentSkillListData = {
    items: AgentSkillDefinition[]
  }

  type AgentEvidenceListData = {
    items: AgentEvidence[]
  }

  type AgentToolCallListData = {
    items: AgentToolCall[]
  }

  type ReloadAgentToolOverride = {
    enabled?: boolean
    description?: string
    timeout_ms?: number
    observe_max_chars?: number
    read_only?: boolean
  }

  type ReloadAgentSkill = {
    id: string
    name: string
    description?: string
    enabled?: boolean
    agent_types?: AgentType[]
    triggers?: string[]
    system_prompt?: string
    allowed_tools?: string[]
    hints?: string[]
  }

  type ReloadAgentRuntimeParams = {
    reason?: string
    remove_overrides?: string[]
    reset?: boolean
    overrides?: Record<string, ReloadAgentToolOverride>
    skills?: ReloadAgentSkill[]
  }

  type ReloadAgentRuntimeResult = {
    reverted: boolean
    changed: boolean
    version_id?: string
    version?: number
    audit_id?: string
    rolled_back_from_version?: string
    tools_enabled: number
    tools_disabled: number
    skills_active: number
  }

  type RollbackAgentRuntimeParams = {
    reason?: string
  }

  type AgentRuntimeConfigSnapshot = {
    overrides?: Record<string, ReloadAgentToolOverride>
    skills?: AgentSkillDefinition[]
  }

  type AgentRuntimeConfigDiff = {
    tool_changes?: AgentRuntimeToolChange[]
    skill_changes?: AgentRuntimeSkillChange[]
  }

  type AgentRuntimeToolChange = {
    tool_id: string
    change_type: 'add' | 'update' | 'remove' | string
    before?: ReloadAgentToolOverride
    after?: ReloadAgentToolOverride
  }

  type AgentRuntimeSkillChange = {
    skill_id: string
    change_type: 'add' | 'update' | 'remove' | string
    before?: AgentSkillDefinition
    after?: AgentSkillDefinition
  }

  type AgentRuntimeConfigVersion = {
    id: string
    version: number
    operator_id: string
    reason?: string
    snapshot: AgentRuntimeConfigSnapshot
    diff: AgentRuntimeConfigDiff
    created_at: string
    deleted_at?: string
  }

  type AgentRuntimeConfigAudit = {
    id: string
    version_id: string
    action: 'reload' | 'reset' | 'rollback' | string
    operator_id: string
    reason?: string
    diff: AgentRuntimeConfigDiff
    created_at: string
    deleted_at?: string
  }

  type AgentRuntimeConfigVersionListData = {
    items: AgentRuntimeConfigVersion[]
  }

  type AgentRuntimeConfigAuditListData = {
    items: AgentRuntimeConfigAudit[]
  }

  type RouteAgentParams = {
    message: string
    selected_agent?: AgentType
    cluster_id?: string
    scope?: AgentScope
  }

  type RunAgentParams = RouteAgentParams & {
    session_id?: string
  }

  type UpdateCurrentUserParams = {
    nickname: string
    email?: string
    phone?: string
    avatar?: string
  }

  type UpdateCurrentUserPasswordParams = {
    old_password: string
    new_password: string
  }

  type SetupMfaData = {
    secret: string
    otp_auth_url: string
  }

  type ConfirmMfaParams = {
    otp_code: string
  }

  type DisableMfaParams = {
    password: string
    otp_code: string
  }

  type UserListData = {
    items: UserItem[]
  }

  type ClusterProvider =
    | 'kubernetes'
    | 'aliyun'
    | 'tencent'
    | 'huawei'
    | 'aws'
    | 'azure'
    | 'google'
    | 'other'
    | 'self_hosted'

  type ClusterItem = {
    id: number
    name: string
    alias?: string
    provider?: ClusterProvider
    yaml?: string
    remarks?: string
    status: number
    test_connection?: boolean
    node_count?: number
    running_state?: string
    version?: string
    message?: string
    create_time?: string
    update_time?: string
    delete_time?: string
  }

  type ClusterListData = {
    items: ClusterItem[]
  }

  type ClusterListParams = {
    keyword?: string
  }

  type ClusterNodeItem = {
    id?: number | string
    name: string
    ip?: string
    internal_ip?: string
    external_ip?: string
    status?: string
    unschedulable?: boolean
    conditions?: ClusterNodeCondition[]
    taints?: ClusterNodeTaint[]
    labels?: Record<string, string>
    annotations?: Record<string, string>
    roles?: string[] | string
    uptime?: string
    age?: string
    architecture?: string
    container_runtime_version?: string
    kernel_version?: string
    version?: string
    kubelet_version?: string
    kube_proxy_version?: string
    operating_system?: string
    os_image?: string
    create_time?: string
  }

  type ClusterNodeCondition = {
    type?: string
    status?: string
  }

  type ClusterNodeTaint = {
    key?: string
    value?: string
    effect?: string
  }

  type ClusterNodeListData = {
    items: ClusterNodeItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodeListParams = {
    keyword?: string
    limit?: number
    continue?: string
  }

  type UpdateClusterNodeSchedulingParams = {
    unschedulable: boolean
  }

  type UpdateClusterNodeLabelsParams = {
    labels: Record<string, string | null>
  }

  type UpdateClusterNodeTaintsParams = {
    taints: ClusterNodeTaint[]
  }

  type ClusterNodeEventItem = {
    id?: string
    type?: string
    reason?: string
    event_time?: string
    source?: string
    message?: string
  }

  type ClusterNodeEventListData = {
    items: ClusterNodeEventItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodeEventListParams = {
    nodeName?: string
    objectKind?: string
    objectName?: string
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterEventObjectRef = {
    apiVersion?: string
    kind?: string
    namespace?: string
    name?: string
    uid?: string
  }

  type ClusterEventItem = {
    id?: string
    uid?: string
    name?: string
    namespace?: string
    resource_version?: string
    type?: string
    reason?: string
    action?: string
    note?: string
    message?: string
    event_time?: string
    first_timestamp?: string
    last_timestamp?: string
    source?: string
    reporting_controller?: string
    reporting_instance?: string
    regarding?: ClusterEventObjectRef
    related?: ClusterEventObjectRef
    series_count?: number
    series_last_observed_time?: string
    expired?: boolean
    raw?: Record<string, unknown>
  }

  type ClusterEventListData = {
    items: ClusterEventItem[]
    continue?: string
    remainingItemCount?: number
    resourceVersion?: string
  }

  type ClusterEventListParams = {
    namespace?: string
    limit?: number
    continue?: string
    resourceVersion?: string
    type?: string
    regardingKind?: string
    regardingName?: string
    keyword?: string
  }

  type ClusterEventWatchEvent = {
    type?: 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK' | 'ERROR' | string
    object?: ClusterEventItem
    resourceVersion?: string
    errorMessage?: string
  }

  type ClusterNodePodItem = {
    id?: string
    name: string
    namespace?: string
    generation?: number
    observed_generation?: number
    node_name?: string
    node_ip?: string
    os_name?: string
    pod_ip?: string
    phase?: string
    qos_class?: string
    ready?: string
    status?: string
    create_time?: string
    containers?: ClusterNodePodContainer[]
    resize_conditions?: ClusterPodResizeCondition[]
    volumes?: ClusterNodePodVolume[]
  }

  type ClusterPodResizeStatus =
    | 'synced'
    | 'pending'
    | 'inProgress'
    | 'deferred'
    | 'infeasible'
    | 'error'
    | 'observing'
    | 'unknown'

  type ClusterPodResizeCondition = {
    type?: string
    status?: string
    reason?: string
    message?: string
    observed_generation?: number
    last_transition_time?: string
  }

  type ClusterNodePodContainer = {
    name?: string
    type?: 'container' | 'initContainer' | 'ephemeralContainer'
    image?: string
    image_pull_policy?: string
    resources?: ClusterNodePodContainerResources
    status_resources?: ClusterNodePodContainerResources
    allocated_resources?: Record<string, string>
    resize_policy?: ClusterNodePodContainerResizePolicy[]
    resize_status?: ClusterPodResizeStatus
    status?: string
    ready?: boolean
    restart_count?: number
    env?: ClusterNodePodContainerEnv[]
    ports?: ClusterNodePodContainerPort[]
    probes?: ClusterNodePodContainerProbe[]
    volume_mounts?: ClusterNodePodContainerVolumeMount[]
  }

  type ClusterNodePodContainerResources = {
    requests?: Record<string, string>
    limits?: Record<string, string>
  }

  type ClusterNodePodContainerResizePolicy = {
    resourceName?: 'cpu' | 'memory'
    restartPolicy?: string
  }

  type ClusterNodePodContainerEnv = {
    name?: string
    value?: string
    value_from?: string
  }

  type ClusterNodePodContainerPort = {
    name?: string
    container_port?: number
    protocol?: string
  }

  type ClusterNodePodContainerProbe = {
    type?: string
    handler?: string
    detail?: string
    initial_delay_seconds?: number
    timeout_seconds?: number
  }

  type ClusterNodePodContainerVolumeMount = {
    name?: string
    mount_path?: string
    sub_path?: string
    read_only?: boolean
  }

  type ClusterNodePodVolume = {
    name?: string
    type?: string
    source_name?: string
    source_path?: string
    read_only?: boolean
  }

  type ClusterNodePodListData = {
    items: ClusterNodePodItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNodePodListParams = {
    nodeName?: string
    namespace?: string
    labelSelector?: string
    limit?: number
    continue?: string
  }

  type ClusterNodePodContainerLogParams = {
    namespace?: string
    podName?: string
    container?: string
    tailLines?: number
    timestamps?: boolean
  }

  type ClusterNamespaceItem = {
    id?: string
    name: string
    status?: string
    conditions?: ClusterNamespaceCondition[]
    labels?: Record<string, string>
    annotations?: Record<string, string>
    create_time?: string
    update_time?: string
  }

  type ClusterNamespaceCondition = {
    type?: string
    status?: string
    reason?: string
    message?: string
    lastTransitionTime?: string
  }

  type ClusterNamespaceListData = {
    items: ClusterNamespaceItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNamespaceListParams = {
    keyword?: string
    limit?: number
    continue?: string
  }

  type CreateClusterNamespaceParams = {
    name: string
  }

  type UpdateClusterNamespaceAnnotationsParams = {
    annotations: Record<string, string | null>
  }

  type UpdateClusterNamespaceDefaultContainerQuotaParams = {
    cpuRequest?: string
    cpuLimit?: string
    memoryRequest?: string
    memoryLimit?: string
  }

  type UpdateClusterNamespaceProjectQuotaParams = {
    cpuRequest?: string
    cpuLimit?: string
    memoryRequest?: string
    memoryLimit?: string
    storageRequest?: string
    storageLimit?: string
    pods?: string
    deployments?: string
    statefulsets?: string
    daemonsets?: string
    jobs?: string
    cronjobs?: string
    persistentVolumeClaims?: string
    services?: string
    ingresses?: string
    secrets?: string
    configMaps?: string
    storageClassQuotas?: UpdateClusterNamespaceStorageClassQuotaParams[]
  }

  type UpdateClusterNamespaceStorageClassQuotaParams = {
    storageClassName?: string
    requestsStorage?: string
    limitsStorage?: string
    persistentVolumeClaims?: string
  }

  type ClusterNamespaceResourceStatus = {
    pods: number
    deployments: number
    statefulsets: number
    daemonsets: number
    jobs: number
    cronjobs: number
    persistentVolumeClaims: number
    services: number
    ingresses: number
  }

  type ClusterNamespacePodListParams = {
    namespace?: string
    labelSelector?: string
    limit?: number
    continue?: string
  }

  type ClusterNamespaceQuotaItem = {
    id?: string
    name?: string
    resource?: string
    used?: string
    hard?: string
    create_time?: string
  }

  type ClusterNamespaceQuotaListData = {
    items: ClusterNamespaceQuotaItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterNamespaceQuotaListParams = {
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterNamespaceDefaultContainerQuota = {
    cpuRequest?: string
    cpuLimit?: string
    memoryRequest?: string
    memoryLimit?: string
  }

  type ClusterNamespaceProjectQuotaValue = {
    used?: string
    hard?: string
  }

  type ClusterNamespaceQuotaSummary = {
    defaultContainer: ClusterNamespaceDefaultContainerQuota
    project: {
      cpuRequest: ClusterNamespaceProjectQuotaValue
      cpuLimit: ClusterNamespaceProjectQuotaValue
      memoryRequest: ClusterNamespaceProjectQuotaValue
      memoryLimit: ClusterNamespaceProjectQuotaValue
      storageRequest: ClusterNamespaceProjectQuotaValue
      storageLimit: ClusterNamespaceProjectQuotaValue
      pods: ClusterNamespaceProjectQuotaValue
      deployments: ClusterNamespaceProjectQuotaValue
      statefulsets: ClusterNamespaceProjectQuotaValue
      daemonsets: ClusterNamespaceProjectQuotaValue
      jobs: ClusterNamespaceProjectQuotaValue
      cronjobs: ClusterNamespaceProjectQuotaValue
      persistentVolumeClaims: ClusterNamespaceProjectQuotaValue
      services: ClusterNamespaceProjectQuotaValue
      ingresses: ClusterNamespaceProjectQuotaValue
      secrets: ClusterNamespaceProjectQuotaValue
      configMaps: ClusterNamespaceProjectQuotaValue
      storageClassQuotas: ClusterNamespaceStorageClassQuota[]
    }
  }

  type ClusterNamespaceStorageClassQuota = {
    storageClassName: string
    requestsStorage?: ClusterNamespaceProjectQuotaValue
    limitsStorage?: ClusterNamespaceProjectQuotaValue
    persistentVolumeClaims?: ClusterNamespaceProjectQuotaValue
  }

  type ClusterWorkloadType = 'Deployment' | 'StatefulSet' | 'DaemonSet'

  type ClusterWorkloadItem = {
    id?: string
    name: string
    namespace?: string
    type: ClusterWorkloadType
    type_label?: string
    status?: string
    ready?: string
    replicas?: number
    ready_replicas?: number
    available_replicas?: number
    updated_replicas?: number
    selector?: Record<string, string>
    labels?: Record<string, string>
    annotations?: Record<string, string>
    create_time?: string
    update_time?: string
  }

  type ClusterWorkloadListData = {
    items: ClusterWorkloadItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterWorkloadListParams = {
    keyword?: string
    type?: ClusterWorkloadType
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterWorkloadDetailParams = {
    type: ClusterWorkloadType
    namespace: string
    name: string
  }

  type CreateClusterWorkloadParams = {
    type: ClusterWorkloadType
    namespace: string
    manifest: Record<string, unknown>
  }

  type UpdateClusterWorkloadReplicasParams = ClusterWorkloadDetailParams & {
    replicas: number
  }

  type UpdateClusterWorkloadManifestParams = ClusterWorkloadDetailParams & {
    manifest: Record<string, unknown>
  }

  type RollbackClusterWorkloadParams = ClusterWorkloadDetailParams & {
    target_revision: number
  }

  type ClusterWorkloadRevisionItem = {
    name?: string
    revision: number
    create_time?: string
  }

  type ClusterWorkloadRevisionListData = {
    items: ClusterWorkloadRevisionItem[]
  }

  type ClusterStorageClassItem = {
    name: string
    provisioner?: string
    storage_type?: string
    persistent_volume_claim_count?: number
    allow_volume_clone?: boolean
    allow_volume_expansion?: boolean
  }

  type ClusterPersistentVolumeItem = {
    id?: string
    name: string
    storageClassName?: string
    capacity?: string
    accessModes?: string[]
    reclaim_policy?: string
    claim_ref?: string
    status?: string
    create_time?: string
  }

  type ClusterHorizontalPodAutoscalerItem = {
    id?: string
    name: string
    namespace?: string
    scale_target?: string
    min_replicas?: number
    max_replicas?: number
    current_replicas?: number
    desired_replicas?: number
    metrics?: string[]
    status?: string
    create_time?: string
  }

  type ClusterNetworkPolicyItem = {
    id?: string
    name: string
    namespace?: string
    pod_selector?: string
    policy_types?: string[]
    ingress_rules?: number
    egress_rules?: number
    create_time?: string
  }

  type ClusterIngressClassItem = {
    id?: string
    name: string
    controller?: string
    default_class?: boolean
    parameters?: string
    create_time?: string
  }

  type ClusterEndpointSliceItem = {
    id?: string
    name: string
    namespace?: string
    service_name?: string
    address_type?: string
    endpoint_count?: number
    ready_count?: number
    ports?: ClusterServiceEndpointPort[]
    create_time?: string
  }

  type ClusterStorageClassListData = {
    items: ClusterStorageClassItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterStorageClassListParams = {
    limit?: number
    continue?: string
  }

  type ClusterPersistentVolumeClaimItem = {
    id?: string
    name: string
    namespace?: string
    storageClassName?: string
    capacity?: string
    accessModes?: string[]
    volume_name?: string
    status?: string
    mounted?: boolean
    create_time?: string
  }

  type ClusterPersistentVolumeClaimListData = {
    items: ClusterPersistentVolumeClaimItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterPersistentVolumeClaimListParams = {
    namespace?: string
    keyword?: string
    limit?: number
    continue?: string
  }

  type ClusterConfigResourceItem = {
    id?: string
    name: string
    namespace?: string
    type?: string
    keys: string[]
    create_time?: string
  }

  type ClusterConfigResourceListData = {
    items: ClusterConfigResourceItem[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterConfigResourceListParams = {
    namespace?: string
    keyword?: string
    limit?: number
    continue?: string
  }

  type ClusterResourceListData<T> = {
    items: T[]
    continue?: string
    remainingItemCount?: number
  }

  type ClusterResourceListParams = {
    keyword?: string
    namespace?: string
    limit?: number
    continue?: string
  }

  type ClusterJobItem = {
    id?: string
    name: string
    namespace?: string
    status?: string
    last_run_time?: string
  }

  type ClusterCronJobItem = {
    id?: string
    name: string
    namespace?: string
    status?: string
    schedule?: string
    create_time?: string
  }

  type ClusterPodItem = {
    id?: string
    name: string
    namespace?: string
    status?: string
    node_name?: string
    pod_ip?: string
    create_time?: string
    update_time?: string
  }

  type ClusterResourceCreateType =
    | 'Job'
    | 'CronJob'
    | 'Pod'
    | 'Service'
    | 'Ingress'
    | 'Secret'
    | 'ConfigMap'
    | 'ServiceAccount'
    | 'Role'
    | 'ClusterRole'
    | 'RoleBinding'
    | 'ClusterRoleBinding'
    | 'CustomResourceDefinition'
    | 'PersistentVolumeClaim'
    | 'PersistentVolume'
    | 'StorageClass'
    | 'HorizontalPodAutoscaler'
    | 'NetworkPolicy'
    | 'IngressClass'
    | 'EndpointSlice'

  type CreateClusterResourceParams = {
    type: ClusterResourceCreateType
    namespace?: string
    manifest: Record<string, unknown>
  }

  type ClusterResourceDetailParams = {
    type: ClusterResourceCreateType
    namespace?: string
    name: string
  }

  type UpdateClusterResourceManifestParams = ClusterResourceDetailParams & {
    manifest: Record<string, unknown>
  }

  type UpdateClusterJobReplicasParams = {
    namespace: string
    name: string
    replicas: number
  }

  type UpdateClusterCronJobSuspendParams = {
    namespace: string
    name: string
    suspend: boolean
  }

  type UpdateClusterServicePatchParams = {
    namespace: string
    name: string
    patch: Record<string, unknown>
  }

  type UpdateClusterPersistentVolumeClaimPatchParams = {
    namespace: string
    name: string
    patch: Record<string, unknown>
  }

  type ResizeClusterPodResourcesParams = {
    namespace: string
    name: string
    patch: Record<string, unknown>
  }

  type RerunClusterJobParams = {
    namespace: string
    name: string
    manifest: Record<string, unknown>
  }

  type ClusterServiceItem = {
    id?: string
    name: string
    namespace?: string
    internal_access?: string
    external_access?: string
    ports?: ClusterServicePortItem[]
    create_time?: string
  }

  type ClusterServicePortItem = {
    name?: string
    port?: number
    protocol?: string
  }

  type ClusterServiceEndpointPort = {
    name?: string
    port?: number
    protocol?: string
  }

  type ClusterServiceEndpointItem = {
    id: string
    ip?: string
    nodeName?: string
    targetKind?: string
    targetName?: string
    targetNamespace?: string
    ready?: boolean
    ports?: ClusterServiceEndpointPort[]
  }

  type ClusterServiceEndpointsParams = {
    namespace: string
    name: string
  }

  type ClusterServiceEndpointsData = {
    items: ClusterServiceEndpointItem[]
  }

  type ClusterIngressItem = {
    id?: string
    name: string
    namespace?: string
    gateway_address?: string
    ingress_class?: string
    create_time?: string
  }

  type ClusterServiceAccountItem = {
    id?: string
    name: string
    namespace?: string
    roles: string[]
    secrets: string[]
    imagePullSecrets?: string[]
    mountableSecrets?: string[]
    create_time?: string
  }

  type RbacSubjectKind = 'ServiceAccount' | 'User' | 'Group'

  type RbacRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'

  type RbacPolicyRule = {
    apiGroups?: string[]
    resources?: string[]
    verbs: string[]
    resourceNames?: string[]
    nonResourceURLs?: string[]
  }

  type RbacSubject = {
    kind: RbacSubjectKind
    name: string
    namespace?: string
    apiGroup?: string
  }

  type RbacRoleRef = {
    kind: 'Role' | 'ClusterRole'
    name: string
    apiGroup?: string
  }

  type RbacRoleItem = {
    id?: string
    name: string
    namespace?: string
    type: 'Role' | 'ClusterRole'
    rules: RbacPolicyRule[]
    rule_count: number
    binding_count: number
    subject_count: number
    risk_level: RbacRiskLevel
    risk_reasons: string[]
    system: boolean
    aggregated: boolean
    labels?: Record<string, string>
    annotations?: Record<string, string>
    create_time?: string
    raw?: Record<string, unknown>
  }

  type RbacBindingItem = {
    id?: string
    name: string
    namespace?: string
    type: 'RoleBinding' | 'ClusterRoleBinding'
    subjects: RbacSubject[]
    roleRef?: RbacRoleRef
    role_name?: string
    role_kind?: string
    scope: 'Cluster' | 'Namespace'
    rule_count: number
    risk_level: RbacRiskLevel
    risk_reasons: string[]
    system: boolean
    create_time?: string
    raw?: Record<string, unknown>
  }

  type RbacSubjectItem = {
    id: string
    kind: RbacSubjectKind
    name: string
    namespace?: string
    binding_count: number
    cluster_binding_count: number
    permission_count: number
    risk_level: RbacRiskLevel
    risk_reasons: string[]
  }

  type RbacListData<T> = {
    items: T[]
  }

  type ClusterCustomResourceDefinitionItem = {
    id?: string
    apiVersions: string[]
    category?: string
    name: string
    scope?: string
    create_time?: string
  }

  type ClusterCustomResourceItem = {
    id?: string
    name: string
    namespace?: string
    create_time?: string
  }

  type ClusterCustomResourceListParams = ClusterResourceListParams & {
    group?: string
    version?: string
    plural?: string
    scope?: string
  }

  type CreateUserParams = {
    username: string
    nickname: string
    password: string
    email?: string
    phone?: string
    avatar?: string
    remarks?: string
    status?: number
  }

  type UpdateUserParams = {
    username: string
    nickname: string
    password?: string
    email?: string
    phone?: string
    avatar?: string
    remarks?: string
    status?: number
  }

  type CreateClusterParams = {
    name: string
    alias?: string
    provider: ClusterProvider
    yaml: string
    remarks?: string
    status?: number
    test_connection?: boolean
  }

  type UpdateClusterParams = CreateClusterParams

}
