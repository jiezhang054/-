# ER Diagram

```
User ──< ProjectMember >── Project ──< Board
                              │
                              └── MindMap

Board ──< BoardColumn
      ──< Swimlane
      ──< Card ──< CardMember / CardLabel / CardChecklist / CardComment
      ──< BoardMember
      ──< BurndownSnapshot

Card ──< CardReference (source_card_id)
User ──< StarredBoard / RecentVisit / ActivityLog
```

Board types: NORMAL | ROADMAP | MILESTONE | SPRINT
Card types: EPIC | USER_STORY | TASK | BUG | OTHER
