# Roll20 API Script for managing Skill challenges. 

Tracks successes and shows random DC for each level. Outputs to a nice box in the chat.

Comments, feedback, suggestions, & pull requests welcome! Reasonable expectations required.

# Instructions

## Start a challenge
`!skillchallenge` to start a skill challenge

## Make a Random Challenge
`!skillchallenge random [heroLevel] [challengeLevel]` to randomize the challenge.

### Hero level options
* `localHeroes` (~Levels 1-5)
* `heroesOfTheRealm` (~Levels 5-10)
* `mastersOfTheRealm` (~Levels 11-15)
* `mastersOfTheWorld` (~Levels 15-20)

### Challenge level options
* `easy` 
* `moderate`
* `hard`

## Other Commands
* `!skillchallenge [easysuccess/mediumsuccess/hardsuccess/veryHardSuccess]` Counts a success 
* `!skillchallenge failure` Counts a failure
* `!skillchallenge start` Resets successes and failure to zero and begins challenge
* `!skillchallenge set [property] [value]` Sets a property to a value.
* `!skillchallenge config` Shows config menu

### Properties and Values
* All properties are Integers
* Successes: `easySuccess` `mediumSuccess` etc.
* Targets: `easyTarget` `veryHardTarget` etc. -- challenge will succeed when successes==target for all difficulties
* Failures: `failures`
* Max Failures: `maxFailures` -- challenge fails when failures==maxFailures

# TODO:
* implement buttons & queries for random challenge
* set default values for config queries
* make "bumper" buttons for editing challenge
* make output all pretty-like with powercards

#Credits:
 * [Robin Kuiper](https://github.com/RobinKuiper/Roll20APIScripts) -- i borrowed heavily from her code for handling inputs, managing state, and setting up listeners. 
 * [Critical-Hit.com](https://critical-hits.com/blog/2016/08/16/skill-challenges-in-5th-edition-dd/) -- was inspired by their table
 * All the people who have ansked and answered questions on the Roll20 forums that saved me from pulling my hair out.
