package com.scrum.dto;

import java.util.List;

public class BoardDetailDTO {
    private Long id;
    private String name;
    private String type;
    private Long projectId;
    private String projectName;
    private Long parentBoardId;
    private Boolean swimlanesEnabled;
    private String startDate;
    private String endDate;
    private Boolean starred;
    private List<ColumnDTO> columns;
    private List<SwimlaneDTO> swimlanes;
    private List<CardDTO> cards;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getParentBoardId() { return parentBoardId; }
    public void setParentBoardId(Long parentBoardId) { this.parentBoardId = parentBoardId; }
    public Boolean getSwimlanesEnabled() { return swimlanesEnabled; }
    public void setSwimlanesEnabled(Boolean swimlanesEnabled) { this.swimlanesEnabled = swimlanesEnabled; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public Boolean getStarred() { return starred; }
    public void setStarred(Boolean starred) { this.starred = starred; }
    public List<ColumnDTO> getColumns() { return columns; }
    public void setColumns(List<ColumnDTO> columns) { this.columns = columns; }
    public List<SwimlaneDTO> getSwimlanes() { return swimlanes; }
    public void setSwimlanes(List<SwimlaneDTO> swimlanes) { this.swimlanes = swimlanes; }
    public List<CardDTO> getCards() { return cards; }
    public void setCards(List<CardDTO> cards) { this.cards = cards; }

    public static class ColumnDTO {
        private Long id; private String name; private Integer sortOrder;
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public Integer getSortOrder() { return sortOrder; } public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    }
    public static class SwimlaneDTO {
        private Long id; private String name; private Integer sortOrder;
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public Integer getSortOrder() { return sortOrder; } public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    }
    public static class CardDTO {
        private Long id; private String title; private String description; private String type;
        private Long columnId; private Long swimlaneId; private Integer sortOrder; private Integer workload;
        private String dueDate; private String startDate; private List<Long> memberIds;
        private List<LabelDTO> labels; private List<ChecklistDTO> checklist; private List<CommentDTO> comments;
        private Boolean isReference; private Long sourceCardId; private String sourceBoardName; private Integer version;
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getType() { return type; } public void setType(String type) { this.type = type; }
        public Long getColumnId() { return columnId; } public void setColumnId(Long columnId) { this.columnId = columnId; }
        public Long getSwimlaneId() { return swimlaneId; } public void setSwimlaneId(Long swimlaneId) { this.swimlaneId = swimlaneId; }
        public Integer getSortOrder() { return sortOrder; } public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
        public Integer getWorkload() { return workload; } public void setWorkload(Integer workload) { this.workload = workload; }
        public String getDueDate() { return dueDate; } public void setDueDate(String dueDate) { this.dueDate = dueDate; }
        public String getStartDate() { return startDate; } public void setStartDate(String startDate) { this.startDate = startDate; }
        public List<Long> getMemberIds() { return memberIds; } public void setMemberIds(List<Long> memberIds) { this.memberIds = memberIds; }
        public List<LabelDTO> getLabels() { return labels; } public void setLabels(List<LabelDTO> labels) { this.labels = labels; }
        public List<ChecklistDTO> getChecklist() { return checklist; } public void setChecklist(List<ChecklistDTO> checklist) { this.checklist = checklist; }
        public List<CommentDTO> getComments() { return comments; } public void setComments(List<CommentDTO> comments) { this.comments = comments; }
        public Boolean getIsReference() { return isReference; } public void setIsReference(Boolean isReference) { this.isReference = isReference; }
        public Long getSourceCardId() { return sourceCardId; } public void setSourceCardId(Long sourceCardId) { this.sourceCardId = sourceCardId; }
        public String getSourceBoardName() { return sourceBoardName; } public void setSourceBoardName(String sourceBoardName) { this.sourceBoardName = sourceBoardName; }
        public Integer getVersion() { return version; } public void setVersion(Integer version) { this.version = version; }
    }
    public static class LabelDTO {
        private Long id; private String name; private String color;
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getColor() { return color; } public void setColor(String color) { this.color = color; }
    }
    public static class ChecklistDTO {
        private Long id; private String text; private Boolean done;
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getText() { return text; } public void setText(String text) { this.text = text; }
        public Boolean getDone() { return done; } public void setDone(Boolean done) { this.done = done; }
    }
    public static class CommentDTO {
        private Long id; private Long userId; private String userName; private String content; private String createdAt;
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUserName() { return userName; } public void setUserName(String userName) { this.userName = userName; }
        public String getContent() { return content; } public void setContent(String content) { this.content = content; }
        public String getCreatedAt() { return createdAt; } public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}
