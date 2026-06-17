$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080/api'
$passed = 0
$failed = 0
$results = @()

function Test-Api {
    param([string]$Name, [scriptblock]$Block)
    try {
        & $Block
        $script:passed++
        $script:results += "[PASS] $Name"
    } catch {
        $script:failed++
        $script:results += "[FAIL] $Name - $($_.Exception.Message)"
    }
}

$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body '{"username":"zhong","password":"123456"}'
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token" }

Test-Api 'M2 auth/me' {
    $me = Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers
    if ($me.data.username -ne 'zhong') { throw 'bad user' }
}

Test-Api 'M1 navigation' {
    $nav = Invoke-RestMethod -Uri "$base/navigation" -Headers $headers
    if (-not $nav.data.boardTree) { throw 'missing boardTree' }
}

Test-Api 'M1 notifications' {
    $n = Invoke-RestMethod -Uri "$base/notifications" -Headers $headers
    if ($null -eq $n.data.unreadCount) { throw 'missing unreadCount' }
}

Test-Api 'M3 workspace dashboard' {
    $d = Invoke-RestMethod -Uri "$base/workspace/dashboard" -Headers $headers
    foreach ($k in @('recentTasks','starredBoards','recentVisits','activities')) {
        if ($null -eq $d.data.$k) { throw "missing $k" }
    }
}

Test-Api 'M4 project detail' {
    $p = Invoke-RestMethod -Uri "$base/projects/1" -Headers $headers
    if ($p.data.boards.Count -lt 1) { throw 'no boards' }
    if (-not $p.data.tabs) { throw 'no tabs' }
}

Test-Api 'M4 project members' {
    $m = Invoke-RestMethod -Uri "$base/projects/1/members" -Headers $headers
    if ($m.data.Count -lt 1) { throw 'no members' }
}

Test-Api 'M4 project stats' {
    $s = Invoke-RestMethod -Uri "$base/projects/1/stats" -Headers $headers
    if ($null -eq $s.data.backlogProgress) { throw 'missing stats' }
}

Test-Api 'M5 my boards list' {
    $b = Invoke-RestMethod -Uri "$base/my/boards" -Headers $headers
    if ($b.data.Count -lt 1) { throw 'empty boards' }
}

Test-Api 'M5 my boards filter' {
    $b = Invoke-RestMethod -Uri "$base/my/boards?filter=incomplete" -Headers $headers
    if ($null -eq $b.data) { throw 'bad filter response' }
}

Test-Api 'M5 mindmaps list' {
    $m = Invoke-RestMethod -Uri "$base/mindmaps" -Headers $headers
    if ($m.data.Count -lt 1) { throw 'empty mindmaps' }
}

Test-Api 'M5 board rename' {
    $boards = Invoke-RestMethod -Uri "$base/my/boards" -Headers $headers
    $boardId = $boards.data[0].id
    $origName = $boards.data[0].name
    $body1 = @{ name = 'integration-rename-test' } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/boards/$boardId" -Method PATCH -Headers $headers -ContentType 'application/json' -Body $body1 | Out-Null
    $body2 = @{ name = $origName } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/boards/$boardId" -Method PATCH -Headers $headers -ContentType 'application/json' -Body $body2 | Out-Null
}

Test-Api 'Cross star sync dashboard' {
    $boards = Invoke-RestMethod -Uri "$base/my/boards" -Headers $headers
    $boardId = $boards.data[0].id
    Invoke-RestMethod -Uri "$base/boards/$boardId/star" -Method POST -Headers $headers | Out-Null
    $dash = Invoke-RestMethod -Uri "$base/workspace/dashboard" -Headers $headers
    $found = $dash.data.starredBoards | Where-Object { $_.id -eq $boardId }
    if (-not $found) { throw 'star not in dashboard' }
    Invoke-RestMethod -Uri "$base/boards/$boardId/star" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'Cross archive restore board' {
    $body = @{ name = 'integration-archive-test'; template = 'NORMAL'; projectId = 1 } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/my/boards" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    $boardId = $created.data.id
    Invoke-RestMethod -Uri "$base/boards/$boardId/archive" -Method POST -Headers $headers | Out-Null
    $archived = Invoke-RestMethod -Uri "$base/my/boards/archived" -Headers $headers
    $found = $archived.data | Where-Object { $_.id -eq $boardId }
    if (-not $found) { throw 'not in archived list' }
    $active = Invoke-RestMethod -Uri "$base/my/boards" -Headers $headers
    $still = $active.data | Where-Object { $_.id -eq $boardId }
    if ($still) { throw 'still in active list after archive' }
    Invoke-RestMethod -Uri "$base/boards/$boardId/restore" -Method POST -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$base/boards/$boardId" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'Cross project board reorder' {
    $p = Invoke-RestMethod -Uri "$base/projects/1" -Headers $headers
    $ids = @($p.data.boards | ForEach-Object { $_.id })
    $reversed = $ids[($ids.Length-1)..0]
    $body = @{ boardIds = $reversed } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/projects/1/boards/order" -Method PUT -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
    $sorted = $ids | Sort-Object
    $body2 = @{ boardIds = @($sorted) } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/projects/1/boards/order" -Method PUT -Headers $headers -ContentType 'application/json' -Body $body2 | Out-Null
}

Test-Api 'M5 mindmap CRUD' {
    $body = @{ name = 'integration-mindmap'; projectId = 1 } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/mindmaps" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    $id = $created.data.id
    $rename = @{ name = 'integration-mindmap-renamed' } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/mindmaps/$id" -Method PATCH -Headers $headers -ContentType 'application/json' -Body $rename | Out-Null
    $copied = Invoke-RestMethod -Uri "$base/mindmaps/$id/copy" -Method POST -Headers $headers
    Invoke-RestMethod -Uri "$base/mindmaps/$($copied.data.id)" -Method DELETE -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$base/mindmaps/$id" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'M5 my boards reorder' {
    $boards = Invoke-RestMethod -Uri "$base/my/boards" -Headers $headers
    $ids = @($boards.data | ForEach-Object { $_.id })
    if ($ids.Count -ge 2) {
        $swap = @($ids[1], $ids[0]) + $ids[2..($ids.Length-1)]
        $body = @{ boardIds = $swap } | ConvertTo-Json
        Invoke-RestMethod -Uri "$base/my/boards/order" -Method PUT -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
        $body2 = @{ boardIds = $ids } | ConvertTo-Json
        Invoke-RestMethod -Uri "$base/my/boards/order" -Method PUT -Headers $headers -ContentType 'application/json' -Body $body2 | Out-Null
    }
}

Test-Api 'M5 create board no project' {
    $body = @{ name = 'personal-board-test'; template = 'NORMAL' } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/my/boards" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    if (-not $created.data.id) { throw 'personal board create failed' }
    Invoke-RestMethod -Uri "$base/boards/$($created.data.id)" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'M5 mindmap archive restore' {
    $body = @{ name = 'integration-mindmap-archive'; projectId = 1 } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/mindmaps" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    $id = $created.data.id
    Invoke-RestMethod -Uri "$base/mindmaps/$id/archive" -Method POST -Headers $headers | Out-Null
    $archived = Invoke-RestMethod -Uri "$base/mindmaps/archived" -Headers $headers
    $found = $archived.data | Where-Object { $_.id -eq $id }
    if (-not $found) { throw 'mindmap not archived' }
    Invoke-RestMethod -Uri "$base/mindmaps/$id/restore" -Method POST -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$base/mindmaps/$id" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'M4 create board with project members' {
    $body = @{ name = 'members-board-test'; template = 'NORMAL'; projectId = 1; addProjectMembers = $true } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/boards" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    if (-not $created.data.id) { throw 'board with members failed' }
    Invoke-RestMethod -Uri "$base/boards/$($created.data.id)" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'M6 board detail' {
    $b = Invoke-RestMethod -Uri "$base/boards/3" -Headers $headers
    if (-not $b.data.columns) { throw 'missing columns' }
    if (-not $b.data.cards) { throw 'missing cards' }
}

Test-Api 'M6 board members' {
    $m = Invoke-RestMethod -Uri "$base/boards/3/members" -Headers $headers
    if ($m.data.Count -lt 1) { throw 'no board members' }
}

Test-Api 'M6 board activities' {
    $a = Invoke-RestMethod -Uri "$base/boards/3/activities" -Headers $headers
    if ($null -eq $a.data) { throw 'bad activities' }
}

Test-Api 'M6 create and update card' {
    $body = @{ columnId = 301; title = 'integration-card'; type = 'TASK' } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "$base/boards/3/cards" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    $cardId = $created.data.id
    if (-not $cardId) { throw 'card create failed' }
    $upd = @{ description = 'test desc'; workload = 2 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/cards/$cardId" -Method PUT -Headers $headers -ContentType 'application/json' -Body $upd | Out-Null
    Invoke-RestMethod -Uri "$base/cards/$cardId" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'M6 add column' {
    $body = @{ name = 'integration-col' } | ConvertTo-Json
    $col = Invoke-RestMethod -Uri "$base/boards/3/columns" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    if (-not $col.data.id) { throw 'column create failed' }
    Invoke-RestMethod -Uri "$base/columns/$($col.data.id)" -Method DELETE -Headers $headers | Out-Null
}

Test-Api 'M6 board labels' {
    $l = Invoke-RestMethod -Uri "$base/boards/3/labels" -Headers $headers
    if ($null -eq $l.data) { throw 'bad labels' }
}

Write-Host ''
Write-Host '========== Integration Test Results =========='
$results | ForEach-Object { Write-Host $_ }
Write-Host ''
Write-Host "Passed: $passed / $($passed + $failed)"
if ($failed -gt 0) { exit 1 }
