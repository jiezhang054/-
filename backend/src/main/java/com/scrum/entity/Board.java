package com.scrum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;

@TableName("boards")
public class Board {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String type;
    private Long projectId;
    private Long parentBoardId;
    private Boolean swimlanesEnabled;
    private LocalDate startDate;
    private LocalDate endDate;
    private String visibility;
    private Boolean archived;
    private Integer sortOrder;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getParentBoardId() { return parentBoardId; }
    public void setParentBoardId(Long parentBoardId) { this.parentBoardId = parentBoardId; }
    public Boolean getSwimlanesEnabled() { return swimlanesEnabled; }
    public void setSwimlanesEnabled(Boolean swimlanesEnabled) { this.swimlanesEnabled = swimlanesEnabled; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public Boolean getArchived() { return archived; }
    public void setArchived(Boolean archived) { this.archived = archived; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
