# CHANGELOG

## [1.0.4] 2020-07-25

### ADDED

-   Add compatibility support for Dynamic Effects "Player Controls Invisible Tokens" setting.

## [1.0.3] 2020-07-20

### ADDED

-   Add compatibility support for "No Summon Vision" (<https://github.com/schultzcole/FVTT-No-Summon-Vision>).

## [1.0.2] 2020-07-13

### FIXED

-   Fixed an issue where custom token darkvision properties added in the PF1 and D35E systems were not being included because of a patch conflict.

## [1.0.1] 2020-07-12

### FIXED

-   Fixed an issue where the light emission of a token was always considered to be at height zero. This resulted in a confusing user experience where a token could only see through a wall when the minimum height was greater than 0.

## [1.0.0] 2020-07-07

The 1.0.0 update introduces a breaking change. Walls that have been set up with wall height will need to be set up again. [A macro](/macros/0.1.0_to_1.0.0_migration.js) is provided that can perform the migration automatically.

Despite being version 1.0.0, this module is _still_ in a pre-release status. Use at your own risk.

### FIXED

-   Improved performance issues with large numbers of walls.

## [0.1.0] 2020-07-05

### ADDED

-   Add top and bottom height for walls.
