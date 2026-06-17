package com.scrum.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.scrum.entity.Card;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CardMapper extends BaseMapper<Card> {}
