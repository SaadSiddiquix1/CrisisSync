-- Add the missing dismissed status used by the app UI and API.
alter type crisis_status_enum add value if not exists 'dismissed';
