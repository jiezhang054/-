package com.scrum.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scrum.entity.Board;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface BoardMapper extends BaseMapper<Board> {}
