package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.Board;
import com.scrum.entity.BoardColumn;
import com.scrum.entity.Card;
import com.scrum.mapper.BoardColumnMapper;
import com.scrum.mapper.BoardMapper;
import com.scrum.mapper.CardMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BurndownService {
    @Autowired private CardMapper cardMapper;
    @Autowired private BoardColumnMapper columnMapper;
    @Autowired private BoardMapper boardMapper;

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> calculate(Long boardId, Map<String, Object> config) {
        String mode = (String) config.getOrDefault("mode", "workload");
        boolean workdaysOnly = Boolean.TRUE.equals(config.get("workdaysOnly"));

        Board board = boardMapper.selectById(boardId);
        LocalDate start = board != null && board.getStartDate() != null ? board.getStartDate() : LocalDate.of(2026, 6, 1);
        LocalDate end = board != null && board.getEndDate() != null ? board.getEndDate() : LocalDate.of(2026, 6, 14);

        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false));

        Set<Long> doneColIds = resolveColumnIds(boardId, config.get("doneColumnIds"), "已完成", "关闭");
        Set<Long> todoColIds = resolveColumnIds(boardId, config.get("todoColumnIds"), "待办", "进行中", "测试中");

        int total = cards.stream().mapToInt(c -> metric(c, mode)).sum();
        int completed = cards.stream().filter(c -> doneColIds.contains(c.getColumnId()))
            .mapToInt(c -> metric(c, mode)).sum();
        int remaining = Math.max(0, total - completed);

        List<LocalDate> dates = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (workdaysOnly && (d.getDayOfWeek().getValue() >= 6)) continue;
            dates.add(d);
        }
        if (dates.isEmpty()) dates.add(start);

        List<Map<String, Object>> points = new ArrayList<>();
        int days = dates.size();
        for (int i = 0; i < days; i++) {
            Map<String, Object> p = new HashMap<>();
            p.put("date", dates.get(i).toString().substring(5));
            int ref = days <= 1 ? remaining : total - (total * i / (days - 1));
            int rem = days <= 1 ? remaining : Math.max(0, total - (completed * (i + 1) / days));
            p.put("remaining", rem);
            p.put("reference", ref);
            p.put("completed", i == 0 ? 0 : Math.min(completed, completed / days + 1));
            p.put("added", 0);
            points.add(p);
        }
        return points;
    }

    private int metric(Card c, String mode) {
        return "workload".equals(mode) ? (c.getWorkload() != null ? c.getWorkload() : 1) : 1;
    }

    private Set<Long> resolveColumnIds(Long boardId, Object configIds, String... fallbackNames) {
        if (configIds instanceof List<?> list && !list.isEmpty()) {
            return list.stream().map(id -> Long.valueOf(id.toString())).collect(Collectors.toSet());
        }
        List<BoardColumn> cols = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId));
        Set<String> names = Set.of(fallbackNames);
        return cols.stream().filter(c -> names.stream().anyMatch(n -> c.getName().contains(n)))
            .map(BoardColumn::getId).collect(Collectors.toSet());
    }
}
