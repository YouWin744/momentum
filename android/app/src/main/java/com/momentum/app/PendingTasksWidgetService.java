package com.momentum.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public class PendingTasksWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new PendingTasksFactory(getApplicationContext());
    }

    private static class PendingTasksFactory implements RemoteViewsFactory {
        private static final String PREFERENCES_NAME = "CapacitorStorage";
        private static final String TASKS_KEY = "momentum_widget_tasks";
        private static final int GROUP_OVERDUE = 0;
        private static final int GROUP_CURRENT = 1;
        private static final int GROUP_TOMORROW = 2;
        private static final int GROUP_LATER = 3;
        private final Context context;
        private final List<WidgetRow> rows = new ArrayList<>();

        PendingTasksFactory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            reloadRows();
        }

        @Override
        public void onDataSetChanged() {
            reloadRows();
        }

        @Override
        public void onDestroy() {
            rows.clear();
        }

        @Override
        public int getCount() {
            return rows.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            WidgetRow row = rows.get(position);
            if (row.isGroup) {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.momentum_widget_group);
                views.setTextViewText(R.id.momentum_widget_group_title, row.name);
                views.setTextColor(
                    R.id.momentum_widget_group_title,
                    row.group == GROUP_OVERDUE ? Color.rgb(239, 68, 68) : Color.rgb(46, 125, 50)
                );
                return views;
            }

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.momentum_widget_task);
            String name = row.name.isEmpty() ? context.getString(R.string.momentum_widget_untitled_task) : row.name;
            views.setTextViewText(R.id.momentum_widget_task_name, name);
            views.setTextViewText(R.id.momentum_widget_task_metadata, formatMetadata(row.task));

            // Calculate the current health value from elapsed time.
            int maxHealth = row.task.optInt("maxHealth", 180);
            int currentHealth = calculateCurrentHealth(row.task);
            int healthPercent = maxHealth > 0 ? (currentHealth * 100) / maxHealth : 0;
            views.setTextViewText(R.id.momentum_widget_task_health, formatHealth(currentHealth));
            views.setInt(R.id.momentum_widget_task_health_bar, "setProgress", healthPercent);
            if (currentHealth <= 0) {
                views.setTextColor(R.id.momentum_widget_task_health, Color.rgb(239, 68, 68));
            }

            // Use green for positive status and red for negative status.
            String status = row.task.optString("status", "positive");
            int dotColor = "positive".equals(status)
                ? Color.rgb(76, 175, 80)
                : Color.rgb(239, 68, 68);
            views.setTextColor(R.id.momentum_widget_task_status_dot, dotColor);
            return views;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 2;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return false;
        }

        private void reloadRows() {
            rows.clear();
            List<JSONObject> tasks = readTasks();
            for (int group = GROUP_OVERDUE; group <= GROUP_LATER; group++) {
                boolean hasGroupTasks = false;
                for (JSONObject task : tasks) {
                    if (getGroup(task.optString("targetTime")) == group) {
                        if (!hasGroupTasks) {
                            rows.add(WidgetRow.group(group, getGroupTitle(group)));
                            hasGroupTasks = true;
                        }
                        rows.add(WidgetRow.task(group, task));
                    }
                }
            }
        }

        private List<JSONObject> readTasks() {
            SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
            String tasksJson = preferences.getString(TASKS_KEY, "[]");
            List<JSONObject> tasks = new ArrayList<>();
            try {
                JSONArray jsonTasks = new JSONArray(tasksJson);
                for (int index = 0; index < jsonTasks.length(); index++) {
                    tasks.add(jsonTasks.getJSONObject(index));
                }
            } catch (Exception ignored) {
                return tasks;
            }
            Collections.sort(tasks, Comparator.comparingLong(task -> getTimestamp(task.optString("targetTime"))));
            return tasks;
        }

        private String getGroupTitle(int group) {
            switch (group) {
                case GROUP_OVERDUE:
                    return context.getString(R.string.momentum_widget_group_overdue);
                case GROUP_CURRENT:
                    return context.getString(R.string.momentum_widget_group_current);
                case GROUP_TOMORROW:
                    return context.getString(R.string.momentum_widget_group_tomorrow);
                default:
                    return context.getString(R.string.momentum_widget_group_later);
            }
        }

        private int getGroup(String value) {
            long timestamp = getTimestamp(value);
            Calendar startOfToday = startOfDay(0);
            Calendar startOfTomorrow = startOfDay(1);
            Calendar startOfDayAfterTomorrow = startOfDay(2);
            if (timestamp < startOfToday.getTimeInMillis()) {
                return GROUP_OVERDUE;
            }
            if (timestamp < startOfTomorrow.getTimeInMillis()) {
                return GROUP_CURRENT;
            }
            if (timestamp < startOfDayAfterTomorrow.getTimeInMillis()) {
                return GROUP_TOMORROW;
            }
            return GROUP_LATER;
        }

        private Calendar startOfDay(int offsetDays) {
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            calendar.add(Calendar.DAY_OF_MONTH, offsetDays);
            return calendar;
        }

        private String formatHealth(int mins) {
            int h = mins / 60;
            int m = mins % 60;
            return h + "h " + m + "m";
        }

        private String formatMetadata(JSONObject task) {
            String type = "long-term".equals(task.optString("type")) ? "LONG" : "SHORT";
            Date date = parseIsoDate(task.optString("targetTime"));
            if (date == null) {
                return type;
            }
            String pattern = context.getString(R.string.momentum_widget_date_format);
            String formattedTime = new SimpleDateFormat(pattern, Locale.US).format(date);
            return type + "  |  " + formattedTime;
        }

        private long getTimestamp(String value) {
            Date date = parseIsoDate(value);
            return date == null ? Long.MAX_VALUE : date.getTime();
        }

        private Date parseIsoDate(String value) {
            try {
                String pattern = value.contains(".") ? "yyyy-MM-dd'T'HH:mm:ss.SSSX" : "yyyy-MM-dd'T'HH:mm:ssX";
                return new SimpleDateFormat(pattern, Locale.US).parse(value);
            } catch (ParseException ignored) {
                return null;
            }
        }

        /**
         * Calculate the current health based on elapsed time since lastSyncTime,
         * mirroring the logic in TaskService.calculateHealth.
         */
        private int calculateCurrentHealth(JSONObject task) {
            int storedHealth = task.optInt("health", 60);
            int maxHealth = task.optInt("maxHealth", 180);
            long lastSync = task.optLong("lastSyncTime", task.optLong("createdAt", 0));
            String status = task.optString("status", "positive");

            if (lastSync <= 0) return storedHealth;

            long now = System.currentTimeMillis();
            long diffMinutes = (now - lastSync) / 60000;
            if (diffMinutes <= 0) return storedHealth;

            int newHealth;
            if ("positive".equals(status)) {
                newHealth = Math.min(maxHealth, storedHealth + (int) diffMinutes);
            } else {
                newHealth = Math.max(0, storedHealth - (int) (diffMinutes * 2));
            }
            return newHealth;
        }
    }

    private static class WidgetRow {
        final int group;
        final boolean isGroup;
        final String name;
        final JSONObject task;

        private WidgetRow(int group, boolean isGroup, String name, JSONObject task) {
            this.group = group;
            this.isGroup = isGroup;
            this.name = name;
            this.task = task;
        }

        static WidgetRow group(int group, String name) {
            return new WidgetRow(group, true, name, null);
        }

        static WidgetRow task(int group, JSONObject task) {
            return new WidgetRow(group, false, task.optString("name"), task);
        }
    }
}
