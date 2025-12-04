# Reminders Feature (提醒事项功能)

## Overview / 概述

The Reminders feature allows users to create recurring interval-based reminders for tasks like drinking water, taking breaks, or any other periodic activity.

提醒事项功能允许用户创建基于时间间隔的重复提醒，用于喝水、休息或其他周期性活动。

## Features / 功能特性

- **Interval-based reminders**: Set reminders that repeat at specified intervals (e.g., every 30 minutes)
- **Custom icons**: Choose emoji or text icons for each reminder
- **Enable/Disable**: Easily toggle reminders on or off
- **Chrome notifications**: Receive browser notifications with Complete and Skip buttons
- **Toast notifications**: Get in-page toast notifications when new tab is open
- **Persistent storage**: Reminders are saved locally and persist across browser sessions

- **间隔时间提醒**：设置按指定间隔重复的提醒（例如每30分钟）
- **自定义图标**：为每个提醒选择表情符号或文本图标
- **启用/禁用**：轻松开关提醒
- **Chrome通知**：接收带有完成和跳过按钮的浏览器通知
- **Toast通知**：新标签页打开时显示页内提醒
- **持久存储**：提醒保存在本地，浏览器会话间保持

## How to Use / 使用方法

### Creating a Reminder / 创建提醒

1. Click the **Settings** button (三 icon) in the new tab page
2. Navigate to the **Reminders** tab (提醒事项)
3. Click the **Add Reminder** button
4. Fill in the form:
   - **Name**: Descriptive name for the reminder (e.g., "Drink water")
   - **Icon**: An emoji or text icon (e.g., "💧")
   - **Interval (minutes)**: How often the reminder should repeat (e.g., 30)
   - **Start Now**: Toggle to start the first reminder immediately
5. Click **Save**

### Managing Reminders / 管理提醒

- **Enable/Disable**: Use the switch on each reminder card to turn it on or off
- **Edit**: Click the "Edit Reminder" button to modify a reminder
- **Delete**: Click the trash icon to remove a reminder

### Responding to Reminders / 响应提醒

When a reminder fires, you'll receive:

1. **Chrome Notification**: A system notification with two buttons:
   - **Complete**: Marks the task as done and starts the next interval
   - **Skip**: Skips this reminder and starts the next interval

2. **Toast Notification**: If the new tab page is open, you'll also see a toast notification

## Technical Details / 技术细节

### Architecture / 架构

- **Storage**: Uses Chrome's local storage API via `@extension/storage`
- **Alarms**: Utilizes `chrome.alarms` API for reliable, persistent reminders
- **Notifications**: Uses `chrome.notifications` API for system notifications
- **Messaging**: Uses internal message passing for toast notifications

### Storage Structure / 存储结构

```typescript
type ReminderItem = {
  id: string                 // Unique identifier
  name: string              // Reminder name
  icon: string              // Display icon (emoji or text)
  enabled: boolean          // Whether the reminder is active
  intervalMinutes: number   // Repeat interval in minutes
  startTime: string         // ISO 8601 timestamp for first reminder
  createdAt: string         // ISO 8601 timestamp of creation
  lastTriggeredAt?: string  // ISO 8601 timestamp of last trigger
}
```

### Alarm Scheduling / 闹钟调度

- Alarms are scheduled using `chrome.alarms.create()` with periodic intervals
- When a reminder is enabled, an alarm is scheduled for the next occurrence
- `lastTriggeredAt` is updated immediately when an alarm fires
- Alarms automatically reschedule for the next interval
- Disabled reminders have their alarms cleared

### Files Modified / 修改的文件

- `packages/storage/lib/impl/reminderStorage.ts` - Storage layer
- `pages/new-tab/src/components/settings/ReminderSettings.tsx` - UI component
- `chrome-extension/src/background/reminders.ts` - Background alarm logic
- `chrome-extension/src/background/index.ts` - Integration point
- `packages/i18n/locales/*/messages.json` - Translations
- `chrome-extension/manifest.js` - Added `alarms` permission

## Future Enhancements / 未来增强

Possible improvements for this feature:

- **Scheduled reminders**: Support for specific times (e.g., 9:00 AM daily)
- **Days of week**: Limit reminders to specific days
- **Sound notifications**: Add audio alerts
- **Snooze option**: Temporarily delay a reminder
- **Statistics**: Track completion rates and history
- **Import/Export**: Backup and restore reminder configurations

可能的功能改进：

- **定时提醒**：支持特定时间（例如每天上午9:00）
- **星期限制**：将提醒限制在特定星期几
- **声音通知**：添加音频提醒
- **贪睡选项**：暂时延迟提醒
- **统计数据**：跟踪完成率和历史记录
- **导入/导出**：备份和恢复提醒配置

## Troubleshooting / 故障排查

### Reminders not firing / 提醒不触发

1. Check if the reminder is enabled (toggle switch should be on)
2. Verify Chrome is running (reminders won't fire if browser is closed)
3. Check browser notification permissions
4. Look at browser console for any error messages

### Notifications not showing / 通知不显示

1. Check browser notification permissions for the extension
2. Verify system notification settings allow Chrome notifications
3. Make sure "Do Not Disturb" mode is not enabled on your system

## License

This feature is part of the Simple Start extension and follows the same license as the main project.
