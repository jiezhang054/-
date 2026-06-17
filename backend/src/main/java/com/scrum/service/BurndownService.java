package com.scrum.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.scrum.entity.BoardColumn;
import com.scrum.entity.Card;
import com.scrum.mapper.BoardColumnMapper;
import com.scrum.mapper.CardMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class BurndownService {
    @Autowired private CardMapper cardMapper;
    @Autowired private BoardColumnMapper columnMapper;

    public List<Map<String, Object>> calculate(Long boardId, Map<String, Object> config) {
        String mode = (String) config.getOrDefault("mode", "workload");
        List<Card> cards = cardMapper.selectList(
            new LambdaQueryWrapper<Card>().eq(Card::getBoardId, boardId).eq(Card::getDeleted, false));

        List<BoardColumn> doneCols = columnMapper.selectList(
            new LambdaQueryWrapper<BoardColumn>().eq(BoardColumn::getBoardId, boardId)
                .eq(BoardColumn::getName, "已完成"));

        Set<Long> doneColIds = new HashSet<>();
        doneCols.forEach(c -> doneColIds.add(c.getId()));

        int total = cards.stream().mapToInt(c -> "workload".equals(mode) ? c.getWorkload() : 1).sum();
        int completed = cards.stream().filter(c -> doneColIds.contains(c.getColumnId()))
            .mapToInt(c -> "workload".equals(mode) ? c.getWorkload() : 1).sum();
        int remaining = total - completed;

        List<Map<String, Object>> points = new ArrayList<>();
        String[] dates = {"2026-06-01", "2026-06-03", "2026-06-05", "2026-06-07", "2026-06-09", "2026-06-11", "2026-06-14"};
        for (int i = 0; i < dates.length; i++) {
            Map<String, Object> p = new HashMap<>();
            p.put("date", dates[i].substring(5));
            int ref = total - (total * i / (dates.length - 1));
            int rem = Math.max(0, remaining + (completed * (dates.length - 1 - i) / dates.length));
            p.put("remaining", rem);
            p.put("reference", ref);
            p.put("completed", i > 0 ? Math.min(completed, 2) : 0);
            p.put("added", 0);
            points.add(p);
        }
        return points;
    }
}
