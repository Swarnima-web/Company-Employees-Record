# Database Schema

## Employees Table

| Field | Type |
|-------|------|
| employee_id | String |
| full_name | String |
| photo | String |
| position | String |
| department | String |
| joining_date | Date |
| monthly_salary | Number |

## Attendance Table

| Field | Type |
|-------|------|
| attendance_id | String |
| employee_id | String |
| date | Date |
| status | String |

## Overtime Table

| Field | Type |
|-------|------|
| overtime_id | String |
| employee_id | String |
| date | Date |
| overtime_hours | Number |

## Salary Table

| Field | Type |
|-------|------|
| salary_id | String |
| employee_id | String |
| month | String |
| present_days | Number |
| overtime_hours | Number |
| final_salary | Number |
