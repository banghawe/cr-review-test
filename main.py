import datetime

print("Hello World")

week_day = datetime.datetime.today().weekday()
week_day_str = ""

if week_day == 0:
    week_day_str = "Monday"
elif week_day == 1:
    week_day_str = "Tuesday"
elif week_day == 2:
    week_day_str = "Wednesday"
elif week_day == 3:
    week_day_str = "Thursday"
elif week_day == 4:
    week_day_str = "Friday"
elif week_day == 5:
    week_day_str = "Saturday"
elif week_day == 6:
    week_day_str = "Sunday"

print(week_day_str)