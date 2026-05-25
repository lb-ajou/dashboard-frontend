# Dashboard Frontend API Migration Guide

이 문서는 대시보드 프론트엔드 개발자가 HA admin API 변경을 반영할 때 참고할 endpoint 목록, 응답 자료형, 마이그레이션 경로를 정리한다.

기준 구현:

- `internal/dashboard/handler.go`
- `internal/dashboard/config_api.go`
- `internal/dashboard/runtime_api.go`
- `internal/dashboard/view.go`
- `internal/admin/service.go`

## 변경 요약

### 새로 추가된 API

| Method | Path | 용도 |
| --- | --- | --- |
| `GET` | `/api/status` | 현재 노드의 짧은 운영 요약 |
| `GET` | `/api/runtime` | 현재 노드에 적용된 route/upstream/runtime 상세 |
| `GET` | `/api/cluster` | Raft cluster leader, local node, members 조회 |
| `POST` | `/api/cluster/join` | 새 Raft node join |
| `PUT` | `/api/namespaces/{namespace}/config` | namespace desired config 전체 저장 |

### 제거된 API

아래 endpoint는 호환 alias 없이 제거됐다. 호출하면 `404 Not Found`를 반환한다.

| Removed API | 대체 API | 비고 |
| --- | --- | --- |
| `GET /api/runtime/config` | `GET /api/runtime` | runtime snapshot 상세로 통합 |
| `GET /api/runtime/routes` | `GET /api/runtime`의 `routes` | runtime route slice를 사용 |
| `GET /api/upstreams` | `GET /api/runtime`의 `upstreams` | target은 문자열이 아니라 object 배열 |
| `GET /api/app-config` | `GET /api/status`, `GET /api/runtime` | 운영 요약과 runtime node 정보로 분리 |
| `GET /api/proxy-configs` | `GET /api/runtime`의 `config_sources` | source별 요약만 제공 |
| `POST /api/raft/join` | `POST /api/cluster/join` | raft join은 cluster join만 사용 |
| `/api/namespaces/{namespace}/routes*` | `GET/PUT /api/namespaces/{namespace}/config` | route CRUD는 namespace config 전체 GET/PUT로 전환 |
| `/api/namespaces/{namespace}/upstream-pools*` | `GET/PUT /api/namespaces/{namespace}/config` | pool CRUD는 namespace config 전체 GET/PUT로 전환 |

## 권장 프론트엔드 데이터 흐름

1. 앱 진입 시 `GET /api/status`로 현재 노드의 mode, Raft 상태, VIP 소유 여부, runtime count를 표시한다.
2. 운영 상세 화면은 `GET /api/runtime`을 사용해 route table, upstream pool, target health를 한 번에 가져온다.
3. Cluster 화면은 `GET /api/cluster`를 사용해 leader, local node, member list를 표시한다.
4. 편집 화면은 `GET /api/namespaces`로 namespace 목록을 가져온다.
5. namespace 선택 후 `GET /api/namespaces/{namespace}/config`로 편집용 desired config를 가져온다.
6. route/pool 편집은 클라이언트 상태에서 수행하고, 저장 시 `PUT /api/namespaces/{namespace}/config`로 전체 config를 보낸다.
7. 쓰기 요청이 `409 not_raft_leader`를 반환하면 `leader_address`를 leader 식별 hint로 보여준다. 이 값은 dashboard HTTP URL이 아니라 Raft advertise address다.

## 공통 타입

아래 TypeScript 타입은 프론트엔드 모델링용 예시다. Go의 `omitempty` 필드는 optional로 표현했다.

```ts
type ConfigStore = "file" | "raft" | string;

type RaftState =
  | "disabled"
  | "leader"
  | "follower"
  | "candidate"
  | "shutdown"
  | "unknown"
  | string;

type QuorumStatus = "available" | "unavailable" | "unknown" | "disabled" | string;

type ClusterMemberRole = "voter" | "nonvoter" | "staging" | "unknown" | string;

type RouteAlgorithm =
  | "round_robin"
  | "sticky_cookie"
  | "5_tuple_hash"
  | "least_connection"
  | string;

type PathKind = "exact" | "prefix" | "regex" | "any" | "unknown" | string;

type PathMatchType = "exact" | "prefix" | "regex";
```

## `GET /api/status`

현재 요청을 받은 노드의 운영 요약이다. 화면 상단의 node status, Raft badge, VIP badge, runtime count에 적합하다.

주의:

- `vip.owned`는 현재 응답한 노드의 로컬 VIP controller 상태다.
- `runtime.*_count`는 현재 응답한 노드의 active snapshot 기준이다.
- file mode에서는 `raft.enabled=false`, `raft.state="disabled"`, `raft.quorum_status="disabled"`가 내려간다.

### Response Type

```ts
interface StatusView {
  node: StatusNodeView;
  raft: StatusRaftView;
  vip: VIPStatusView;
  runtime: StatusRuntimeView;
}

interface StatusNodeView {
  id?: string;
  config_store: ConfigStore;
  proxy_listen_addr: string;
  dashboard_listen_addr: string;
  applied_at: string;
  projection: ProjectionView;
}

interface ProjectionView {
  status: "ok" | "degraded" | string;
  last_error?: string;
}

interface StatusRaftView {
  enabled: boolean;
  state: RaftState;
  is_leader: boolean;
  leader_id?: string;
  leader_address?: string;
  has_leader: boolean;
  quorum_status: QuorumStatus;
}

interface VIPStatusView {
  enabled: boolean;
  interface?: string;
  address?: string;
  owned: boolean;
  last_error?: string;
}

interface StatusRuntimeView {
  route_count: number;
  upstream_pool_count: number;
  target_count: number;
  healthy_target_count: number;
  unhealthy_target_count: number;
}
```

### Example

```json
{
  "node": {
    "id": "node-1",
    "config_store": "raft",
    "proxy_listen_addr": ":8080",
    "dashboard_listen_addr": ":9090",
    "applied_at": "2026-05-24T12:00:00Z",
    "projection": {
      "status": "ok"
    }
  },
  "raft": {
    "enabled": true,
    "state": "leader",
    "is_leader": true,
    "leader_id": "node-1",
    "leader_address": "127.0.0.1:7001",
    "has_leader": true,
    "quorum_status": "available"
  },
  "vip": {
    "enabled": true,
    "interface": "eth0",
    "address": "172.30.10.100/24",
    "owned": true
  },
  "runtime": {
    "route_count": 1,
    "upstream_pool_count": 1,
    "target_count": 3,
    "healthy_target_count": 3,
    "unhealthy_target_count": 0
  }
}
```

## `GET /api/runtime`

현재 요청을 받은 노드에 실제 적용된 runtime snapshot이다. 기존 `runtime/routes`, `upstreams`, `proxy-configs` 조회를 한 화면에서 대체할 수 있다.

주의:

- 이 응답은 편집용 원본 config가 아니다. 편집 화면은 `GET /api/namespaces/{namespace}/config`를 사용한다.
- `upstreams[].targets[]`의 health와 active connection은 로컬 관측값이다. 다른 노드에서는 다르게 보일 수 있다.
- 기존 `GET /api/upstreams`와 달리 `targets`가 문자열 배열이 아니라 object 배열이다.

### Response Type

```ts
interface RuntimeView {
  applied_at: string;
  node: RuntimeNodeView;
  config_sources: RuntimeConfigSourceView[];
  routes: RuntimeRouteView[];
  upstreams: RuntimeUpstreamView[];
}

interface RuntimeNodeView {
  id?: string;
  config_store: ConfigStore;
}

interface RuntimeConfigSourceView {
  source: string;
  path?: string;
  name?: string;
  route_count: number;
  upstream_pool_count: number;
}

interface RuntimeRouteView {
  global_id: string;
  local_id: string;
  source: string;
  enabled: boolean;
  hosts: string[];
  path: RuntimePathMatcherView;
  algorithm: RouteAlgorithm;
  upstream_pool: string;
}

interface RuntimePathMatcherView {
  kind: PathKind;
  value?: string;
}

interface RuntimeUpstreamView {
  global_id: string;
  local_id: string;
  source: string;
  targets: RuntimeTargetView[];
  health_check?: RuntimeHealthCheckView;
}

interface RuntimeTargetView {
  address: string;
  healthy: boolean;
  last_checked_at?: string;
  last_error?: string;
  active_connections: number;
}

interface RuntimeHealthCheckView {
  path: string;
  interval: string;
  timeout: string;
  expect_status: number;
}
```

### Example

```json
{
  "applied_at": "2026-05-24T12:00:00Z",
  "node": {
    "id": "node-1",
    "config_store": "raft"
  },
  "config_sources": [
    {
      "source": "default",
      "path": "configs/proxy/default.json",
      "name": "default",
      "route_count": 1,
      "upstream_pool_count": 1
    }
  ],
  "routes": [
    {
      "global_id": "default:r-api",
      "local_id": "r-api",
      "source": "default",
      "enabled": true,
      "hosts": ["api.example.com"],
      "path": {
        "kind": "prefix",
        "value": "/"
      },
      "algorithm": "sticky_cookie",
      "upstream_pool": "default:pool-api"
    }
  ],
  "upstreams": [
    {
      "global_id": "default:pool-api",
      "local_id": "pool-api",
      "source": "default",
      "targets": [
        {
          "address": "10.0.0.11:8080",
          "healthy": true,
          "active_connections": 0
        },
        {
          "address": "10.0.0.12:8080",
          "healthy": false,
          "last_checked_at": "2026-05-24T12:00:00Z",
          "last_error": "unexpected status: 503",
          "active_connections": 0
        }
      ],
      "health_check": {
        "path": "/health",
        "interval": "30s",
        "timeout": "3s",
        "expect_status": 200
      }
    }
  ]
}
```

## `GET /api/cluster`

Raft cluster 상태와 membership을 반환한다. Cluster 화면, leader 표시, follower write 안내에 사용한다.

주의:

- `leader.address`는 Raft advertise address다. dashboard/admin HTTP URL이 아니다.
- file mode에서는 `enabled=false`로 응답하며 HTTP status는 `200`이다.
- follower 노드는 quorum을 직접 확정하기 어려우므로 `quorum_status="unknown"`일 수 있다.

### Response Type

```ts
interface ClusterView {
  enabled: boolean;
  quorum_status?: QuorumStatus;
  leader: ClusterLeaderView;
  local: ClusterLocalView;
  members: ClusterMemberView[];
}

interface ClusterLeaderView {
  id?: string;
  address?: string;
}

interface ClusterLocalView {
  id?: string;
  address?: string;
  state?: RaftState;
  last_log_index?: string;
  commit_index?: string;
  applied_index?: string;
  term?: string;
}

interface ClusterMemberView {
  id: string;
  address: string;
  role: ClusterMemberRole;
  is_leader: boolean;
}
```

### Example

```json
{
  "enabled": true,
  "quorum_status": "available",
  "leader": {
    "id": "node-1",
    "address": "127.0.0.1:7001"
  },
  "local": {
    "id": "node-2",
    "address": "127.0.0.1:7002",
    "state": "follower",
    "last_log_index": "12",
    "commit_index": "12",
    "applied_index": "12",
    "term": "2"
  },
  "members": [
    {
      "id": "node-1",
      "address": "127.0.0.1:7001",
      "role": "voter",
      "is_leader": true
    },
    {
      "id": "node-2",
      "address": "127.0.0.1:7002",
      "role": "voter",
      "is_leader": false
    }
  ]
}
```

## Config 편집 API

### `GET /api/namespaces`

namespace 목록과 count를 반환한다.

```ts
interface NamespaceListView {
  items: NamespaceView[];
  default_namespace: string;
}

interface NamespaceView {
  namespace: string;
  path: string;
  exists: boolean;
  route_count: number;
  upstream_pool_count: number;
}
```

### `GET /api/namespaces/{namespace}/config`

편집용 desired config view다. 이 응답을 form state의 원본으로 사용한다.

```ts
interface NamespaceConfigView {
  namespace: string;
  exists: boolean;
  routes: RouteConfig[];
  upstream_pools: Record<string, UpstreamPool>;
  applied_at?: string;
}
```

### `PUT /api/namespaces/{namespace}/config`

namespace 전체 desired config를 저장한다. route/pool 개별 CRUD API는 제거됐으므로, 편집 UI는 항상 `GET /api/namespaces/{namespace}/config`로 전체 config를 읽고 `PUT /api/namespaces/{namespace}/config`로 전체 config를 저장한다.

Request:

```ts
interface NamespaceConfigPutRequest {
  routes: RouteConfig[];
  upstream_pools: Record<string, UpstreamPool>;
}
```

Response:

```ts
type NamespaceConfigPutResponse = NamespaceConfigView;
```

Example request:

```json
{
  "routes": [
    {
      "id": "r-api",
      "enabled": true,
      "algorithm": "round_robin",
      "match": {
        "hosts": ["api.example.com"],
        "path": {
          "type": "prefix",
          "value": "/api/"
        }
      },
      "upstream_pool": "pool-api"
    }
  ],
  "upstream_pools": {
    "pool-api": {
      "upstreams": ["10.0.0.11:8080"],
      "health_check": {
        "path": "/health",
        "interval": "30s",
        "timeout": "3s",
        "expect_status": 200
      }
    }
  }
}
```

### 편집용 Config 타입

```ts
interface RouteConfig {
  id: string;
  enabled: boolean;
  match: RouteMatchConfig;
  algorithm?: RouteAlgorithm;
  upstream_pool: string;
}

interface RouteMatchConfig {
  hosts: string[];
  path?: PathMatchConfig;
}

interface PathMatchConfig {
  type: PathMatchType;
  value: string;
}

interface UpstreamPool {
  upstreams: string[];
  health_check?: HealthCheckConfig;
}

interface HealthCheckConfig {
  path: string;
  interval: string;
  timeout: string;
  expect_status: number;
}
```

검증 규칙:

- `match.hosts`는 최소 1개 이상이어야 한다.
- `path.type`은 `exact`, `prefix`, `regex`만 허용한다.
- `exact`, `prefix` path는 `/`로 시작해야 한다.
- `prefix`는 `/` 또는 `/.../` 형태여야 한다.
- `algorithm` 생략 시 서버는 `round_robin`으로 동작한다.
- `upstream_pool`은 같은 namespace의 `upstream_pools`에 있어야 한다.
- `upstreams[]`는 `host:port` 또는 `[ipv6]:port` 형식이어야 한다.
- `health_check.interval`, `health_check.timeout`은 Go duration 문자열이다. 예: `5s`, `30s`, `1m`.
- `health_check.expect_status`는 `100..599` 범위여야 한다.

## Join API

### `POST /api/cluster/join`

새 Raft node를 cluster에 join시키는 control-plane API다. 대시보드 일반 화면보다는 운영 도구나 smoke test에서 사용한다.

Request:

```ts
interface ClusterJoinRequest {
  node_id: string;
  raft_address: string;
}
```

Success:

- `204 No Content`

Removed:

- `POST /api/raft/join`은 제거됐으며 `404 Not Found`를 반환한다. raft join은 `POST /api/cluster/join`만 사용한다.

## 에러 응답

모든 JSON API error는 같은 envelope을 사용한다.

```ts
interface APIErrorResponse {
  message: string;
  code?: string;
  leader_address?: string;
  errors?: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

예:

```json
{
  "message": "validation failed",
  "code": "validation_failed",
  "errors": [
    {
      "field": "routes[0].id",
      "message": "duplicate route id"
    }
  ]
}
```

HA mode follower write 예:

```json
{
  "message": "configuration writes must be sent to the raft leader",
  "code": "not_raft_leader",
  "leader_address": "127.0.0.1:7001"
}
```

프론트엔드 처리 권장:

- `code === "not_raft_leader"`이면 쓰기 요청이 follower로 간 것이다.
- `leader_address`는 Raft address hint로 표시만 한다. 이 값으로 곧장 `fetch()` 재시도하지 않는다.
- `errors[]`가 있으면 field별 form validation으로 매핑한다.

## 마이그레이션 체크리스트

- [ ] Node summary 카드가 있다면 `GET /api/status`로 교체한다.
- [ ] Route runtime table이 `GET /api/runtime/routes`를 호출한다면 제거된 endpoint이므로 `GET /api/runtime`의 `routes`를 사용하도록 변경한다.
- [ ] Upstream runtime table이 `GET /api/upstreams`를 호출한다면 제거된 endpoint이므로 `GET /api/runtime`의 `upstreams`를 사용하도록 변경한다.
- [ ] Upstream target 렌더링은 string target에서 object target으로 바꾼다. `target.address`를 표시하고, `target.healthy`, `target.last_error`, `target.active_connections`를 함께 표시한다.
- [ ] Cluster/HA 화면은 `GET /api/cluster`를 사용한다.
- [ ] Join 요청은 `POST /api/cluster/join`만 사용한다. 기존 `/api/raft/join`은 제거됐고 `404`를 반환한다.
- [ ] Config 저장은 `PUT /api/namespaces/{namespace}/config`로 전체 저장한다.
- [ ] 기존 route/pool 단건 CRUD 호출은 모두 제거한다. `/api/namespaces/{namespace}/routes*`, `/api/namespaces/{namespace}/upstream-pools*`는 `404`를 반환한다.
- [ ] 모든 쓰기 API에서 `409` + `code="not_raft_leader"` 처리를 공통화한다.

## 빠른 매핑 예시

기존:

```ts
const routes = await get<RuntimeRouteView[]>("/api/runtime/routes");
const upstreams = await get<LegacyUpstreamView[]>("/api/upstreams");
```

신규:

```ts
const runtime = await get<RuntimeView>("/api/runtime");
const routes = runtime.routes;
const upstreams = runtime.upstreams;
```

기존:

```ts
await post(`/api/namespaces/${namespace}/routes`, route);
```

신규 권장:

```ts
const config = await get<NamespaceConfigView>(`/api/namespaces/${namespace}/config`);
const nextConfig: NamespaceConfigPutRequest = {
  routes: [...config.routes, route],
  upstream_pools: config.upstream_pools
};
await put<NamespaceConfigView>(`/api/namespaces/${namespace}/config`, nextConfig);
```
