package com.scrum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;

@TableName("cards")
public class Card {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long boardId;
    private Long columnId;
    private Long swimlaneId;
    private String title;
    private String description;
    private String type;
    private Integer sortOrder;
    private Integer workload;
    private LocalDate dueDate;
    private LocalDate startDate;
    private Boolean isReference;
    private Long sourceCardId;
    private Integer version;
    private Boolean deleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBoardId() { return boardId; }
    public void setBoardId(Long boardId) { this.boardId = boardId; }
    public Long getColumnId() { return columnId; }
    public void setColumnId(Long columnId) { this.columnId = columnId; }
    public Long getSwimlaneId() { return swimlaneId; }
    public void setSwimlaneId(Long swimlaneId) { this.swimlaneId = swimlaneId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getWorkload() { return workload; }
    public void setWorkload(Integer workload) { this.workload = workload; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public Boolean getIsReference() { return isReference; }
    public void setIsReference(Boolean isReference) { this.isReference = isReference; }
    public Long getSourceCardId() { return sourceCardId; }
    public void setSourceCardId(Long sourceCardId) { this.sourceCardId = sourceCardId; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
}
