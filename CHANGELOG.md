# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [1.18.0] - 2022-02-23
Version number not changed (documentation update)
### Changed
+ Updated sample data, added screenshot and instructions to clarify visual usage.

## [1.18.0] - 2018-05-07
### Changed
+ There is a problem in the y-axis labelling when the label is in the right hand data and not the left, and right hand data is included as a block after the left hand data. In such cases the extra right hand labels are printed out of order at the top of the chart. Code amended to re-sort the data in such a way that left and right label order is merged in order rather than extra labels concatenated at the top of the axis.
+ Updated dependencies

## [1.16.0] - 2018-04-29
### Added
+ Filter y axis labels when chart height is small and labels overlap

## [1.14.0] - 2018-04-28
### Added
+ Bookmark support
### Changed 
+ Moved data filter to own section in configuration panel
+ Updated dependencies

## [1.12.0] - 2018-02-13
### Added
First release
