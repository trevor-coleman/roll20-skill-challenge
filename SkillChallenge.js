/*
 * Version 0.0.1
 * Made By Trevor Coleman
 * Roll20: https://app.roll20.net/users/1672428/trevor-c
 * Github: https://github.com/trevor-coleman/roll20-skill-challenge
 * Based off the table on this page: https://critical-hits.com/blog/2016/08/16/skill-challenges-in-5th-edition-dd/
 * Works independent of sheet, for any d20 system
*/

var SkillChallenge = SkillChallenge || (function () {
  'use strict';

  let whisper;
  let times = 0;

  const version = "0.1.1",
    script_name = 'SkillChallenge',
    state_name = 'SKILLCHALLENGE',
    EASY = "1",
    MEDIUM = "2",
    HARD = "3",
    difficultyPresets = {
      localHeroes: {
        easy: {
          possibleValues: [EASY],
          difficultyPoints: [3, 4]
        },

        moderate: {
          possibleValues: [EASY, MEDIUM],
          difficultyPoints: [5, 6],
        },
        hard: {
          possibleValues: [EASY, MEDIUM],
          difficultyPoints: [7, 10]
        }
      },
      heroesOfTheRealm: {
        easy: {
          possibleValues: [EASY],
          difficultyPoints: [6, 8]
        },
        moderate: {
          possibleValues: [EASY, MEDIUM],
          difficultyPoints: [9, 15],
        },

        hard: {
          possibleValues: [MEDIUM, HARD],
          difficultyPoints: [12, 16]
        }
      },
      mastersOfTheRealm: {
        easy: {
          possibleValues: [MEDIUM],
          difficultyPoints: [6, 12]
        },
        moderate: {
          possibleValues: [MEDIUM, HARD],
          difficultyPoints: [14, 18],
        },

        hard: {
          possibleValues: [MEDIUM, HARD],
          difficultyPoints: [20, 30]
        }
      }
    },


    handleInput = (msg) => {
      if (msg.type != 'api') return;

      let args = msg.content.split(' ');
      let command = args.shift().substring(1);
      let extracommand = args.shift();

      if (command === state[state_name].config.command) {
        switch (extracommand) {
          case 'test':
            if (!playerIsGM(msg.playerid)) return;
            sendMessage("test")
            break;
          case 'easysuccess':
            if (!playerIsGM(msg.playerid)) return;
            log("@@@@ - easy success")
            state[state_name].challenge.easySuccess++;
            state[state_name].challenge.easySuccess =
              state[state_name].challenge.easySuccess > state[state_name].challenge.easyTarget
                ? state[state_name].challenge.easyTarget
                : state[state_name].challenge.easySuccess;
            SendSkillChallengeMenu();
            break;
          case 'mediumsuccess':
            if (!playerIsGM(msg.playerid)) return;
            log("@@@@ - medium success")
            state[state_name].challenge.mediumSuccess++;
            state[state_name].challenge.mediumSuccess =
              state[state_name].challenge.mediumSuccess > state[state_name].challenge.mediumTarget
                ? state[state_name].challenge.mediumTarget
                : state[state_name].challenge.mediumSuccess;
            SendSkillChallengeMenu();
            break;
          case 'hardsuccess':
            if (!playerIsGM(msg.playerid)) return;
            log("@@@@ - hard success")
            state[state_name].challenge.hardSuccess++;
            state[state_name].challenge.hardSuccess =
              state[state_name].challenge.hardSuccess >= state[state_name].challenge.hardTarget
                ? state[state_name].challenge.hardTarget
                : state[state_name].challenge.hardSuccess;
            SendSkillChallengeMenu();
            break;
          case 'veryhardsuccess':
            if (!playerIsGM(msg.playerid)) return;
            log("@@@@ - veryHard success")
            state[state_name].challenge.veryHardSuccess++;
            state[state_name].challenge.veryHardSuccess =
              state[state_name].challenge.veryHardSuccess >= state[state_name].challenge.veryHardTarget
                ? state[state_name].challenge.veryHardTarget
                : state[state_name].challenge.veryHardSuccess;
            SendSkillChallengeMenu();
            break;
          case 'failure':
            if (!playerIsGM(msg.playerid)) return;
            state[state_name].challenge.failures++;
            state[state_name].challenge.failures =
              state[state_name].challenge.failures > state[state_name].challenge.maxFailures
                ? state[state_name].challenge.maxFailures
                : state[state_name].challenge.failures;
            SendSkillChallengeMenu();
            break;
          case 'config':
            SendConfigMenu();
            break;
          case 'set':
            if (args.length) {
              SetChallengeValue(args);
            } else {
              sendChat(script_name, "Nothing to set.");
            }
            break;
          case 'random':
            if (args.length == 2) {
              let heroLevel = args.shift();
              let challengeLevel = args.shift();
              sendChat('script_name', "makeRandom - " + heroLevel + "-" + challengeLevel);
              MakeRandomChallenge(heroLevel, challengeLevel);
            }
            else {
              sendChat('script_name', "random requires exactly 2 arguments - heroLevel and challengeLevel")
            }
          case 'start':
            SetSuccessesToZero();
            SendSkillChallengeMenu();
            break;
          case 'reset':
            if (!playerIsGM(msg.playerid)) return;
            state[state_name] = {};
            setDefaults(true);
            sendMessage("Reset Challenge");
            SendSkillChallengeMenu();
            break;
          default:
            SendSkillChallengeMenu();
            break;
        }
      }
    },

    CheckIfComplete = () => {
      let challenge = state[state_name].challenge
      if (challenge.easySuccess >= challenge.easyTarget
        && challenge.mediumSuccess >= challenge.mediumTarget
        && challenge.hardSuccess >= challenge.hardTarget
        && challenge.veryHardSuccess >= challenge.veryHardTarget
      ) {
        let completeSuccessMessage = whisper + `&{template:default} {{name=Skill Challenge}} {{Easy=${challenge.easySuccess}/${challenge.easyTarget}}} {{Medium=${challenge.mediumSuccess}/${challenge.mediumTarget}}} {{Hard=${challenge.hardSuccess}/${challenge.hardTarget}}} {{Very Hard=${challenge.veryHardSuccess}/${challenge.veryHardTarget}}} {{Failures=${challenge.failures}/${challenge.maxFailures}}} {{Status=**Success with ${challenge.failures} failures!**}} {{Options=[Reset](!skillchallenge reset)}}`;
        sendMessage(completeSuccessMessage);
        return true;
      }
      if (challenge.failures == challenge.maxFailures) {
        let completeFailedMessage = `&{template:default} {{name=Skill Challenge}} {{Easy=${challenge.easySuccess}/${challenge.easyTarget}}} {{Medium=${challenge.mediumSuccess}/${challenge.mediumTarget}}} {{Hard=${challenge.hardSuccess}/${challenge.hardTarget}}} {{Very Hard=${challenge.veryHardSuccess}/${challenge.veryHardTarget}}} {{Failures=${challenge.failures}/${challenge.maxFailures} **<-- FAILED**}} {{Status=**Failed with ${challenge.failures} failures!**}} {{Options=[Reset](!skillchallenge reset)}}`;
        sendMessage(completeFailedMessage);
        return true;
      }



    },
    SendConfigMenu = () => {
      let challenge = state[state_name].challenge;
      let setupMenuString = whisper + `&{template:default} {{name=Config}} {{Easy Target=${challenge.easyTarget} [Change](!skillchallenge set easyTarget ?{How many easy successes?})}} {{Medium Target=${challenge.mediumTarget} [Change](!skillchallenge set mediumTarget ?{How many medium successes?})}} {{Hard Target=${challenge.hardTarget} [Change](!skillchallenge set hardTarget ?{How many hard successes?})}} {{Very Hard Target=${challenge.veryHardTarget} [Change](!skillchallenge set veryHardTarget ?{How many veryHard successes?})}} {{Options= [Start Challenge](!skillchallenge start)}}`
      sendChat(script_name, setupMenuString);
    },


    MakeRandomChallenge = (heroLevel, challengeLevel) => {
      let preset = difficultyPresets[heroLevel][challengeLevel];
      let difficultyPoints = CalculateRandomDifficultyPoints(preset);

      SetTargetsToZero();

      do {
        let randomDifficulty = preset.possibleValues[Math.floor(Math.random() * preset.possibleValues.length)]
        if (randomDifficulty <= difficultyPoints) {
          IncreaseTargetForDifficulty(randomDifficulty);
          difficultyPoints -= randomDifficulty;
        } else {
          difficultyPoints -= preset.possibleValues[0];
        }
      } while (difficultyPoints > 0)

      SendSkillChallengeMenu();
    },

    IncreaseTargetForDifficulty = (difficulty) => {
      switch (difficulty) {
        case EASY:
          state[state_name].challenge.easyTarget++;
          break;
        case MEDIUM:
          state[state_name].challenge.mediumTarget++
          break;
        case HARD:
          state[state_name].challenge.hardTarget++
          break;
        default:
          log(script_name + " -- " + "ERROR -- UNKNOWN DIFFICULTY")
          break;
      }
    },

    CalculateRandomDifficultyPoints = (preset) => {
      let range = preset.difficultyPoints[1] - preset.difficultyPoints[0] + 1;
      return Math.floor((Math.random() * range) + preset.difficultyPoints[0]);
    },

    SendSkillChallengeMenu = () => {

      if (!CheckIfComplete()) {
        let challenge = state[state_name].challenge

        let easyButton = "[Easy Success](!skillchallenge easysuccess)";
        let mediumButton = "[Medium Success](!skillchallenge mediumsuccess)";
        let hardButton = "[Hard Success](!skillchallenge hardsuccess)";
        let veryHardButton = "[Very Hard Success](!skillchallenge veryhardsuccess)";
        let failureButton = "[Failure](!skillchallenge failure)";

        let easyRoll = "[[1d5+7]]"
        let mediumRoll = "[[1d5+12]]"
        let hardRoll = "[[1d5+17]]"
        let veryHardRoll = "[[1d5+22]]"

        // var menu_string = `!power {{ --txcolor|#FFFFFF --bgcolor|#AD3B3B --orowbg|#FFFFFF --erowbg|#FFFFFF --name|Skill Challenge --Easy|${easySuccess} / ${easyTarget} --!buttons|[Record Easy](!skillchallenge easysuccess)}}`
        let menu_string = whisper + `&{template:default} {{name=Skill Challenge}} {{Easy=${challenge.easySuccess}/${challenge.easyTarget} ${easyRoll}}} {{Medium=${challenge.mediumSuccess}/${challenge.mediumTarget} ${mediumRoll}}} {{Hard=${challenge.hardSuccess}/${challenge.hardTarget} ${hardRoll}}} {{Very Hard=${challenge.veryHardSuccess}/${challenge.veryHardTarget} ${veryHardRoll}}} {{Failures=${challenge.failures}/${challenge.maxFailures}}} {{Success=${easyButton}\n${mediumButton}\n${hardButton}\n${veryHardButton}}} {{Failure=${failureButton}}} {{Options=[Reset](!skillchallenge reset) [Config](!skillchallenge config)}}`;
        log("MENUSTRING----  ");
        log(menu_string);
        try {
          sendChat(script_name, menu_string);
          log("sent " + times++ + " times");
        } catch (error) {
          log(error)
        }
      }
    },

    SetSuccessesToZero = () => {
      state[state_name].challenge.easySuccess = 0;
      state[state_name].challenge.mediumSuccess = 0;
      state[state_name].challenge.hardSuccess = 0;
      state[state_name].challenge.veryhardSuccess = 0;
    },

    SetTargetsToZero = () => {
      state[state_name].challenge.easyTarget = 0;
      state[state_name].challenge.mediumTarget = 0;
      state[state_name].challenge.hardTarget = 0;
      state[state_name].challenge.veryHardTarget = 0;
    },

    sendMessage = (message) => {
      sendChat(script_name, message);
    },

    SetChallengeValue = (args) => {
      let property = args.shift()
      let value = args.shift()

      state[state_name].challenge[property] = value;

      SendConfigMenu();
    },

    checkInstall = () => {
      if (!_.has(state, state_name)) {
        state[state_name] = state[state_name] || {};
      }
      setDefaults();

      log(">>> " + script_name + ' Ready! Command: !' + state[state_name].config.command);
    },

    registerEventHandlers = () => {
      on('chat:message', handleInput);
    },


    setDefaults = (reset) => {

      const defaults = {
        config: {
          command: 'skillchallenge',
          userAllowed: false,
          sendOnlyToGM: true,
        },
        challenge: {
          easySuccess: 0,
          easyTarget: 5,
          mediumSuccess: 0,
          mediumTarget: 1,
          hardSuccess: 0,
          hardTarget: 0,
          veryHardSuccess: 0,
          veryHardTarget: 0,
          nearlyImpossibleSuccess: 0,
          nearlyImpossibleTarget: 0,
          failures: 0,
          maxFailures: 3,
        }
      };

      if (!state[state_name].config) {
        state[state_name].config = defaults.config;
      } else {
        if (!state[state_name].config.hasOwnProperty('command')) {
          state[state_name].config.command = defaults.config.command;
        }
        if (!state[state_name].config.hasOwnProperty('userAllowed')) {
          state[state_name].config.userAllowed = defaults.config.userAllowed;
        }
        if (!state[state_name].config.hasOwnProperty('sendOnlyToGM')) {
          state[state_name].config.sendOnlyToGM = defaults.config.sendOnlyToGM;
        }
      }

      if (!state[state_name].challenge || typeof state[state_name].challenge !== 'object') {
        state[state_name].challenge = defaults.challenge;

      }

      whisper = (state[state_name].config.sendOnlyToGM) ? '/w gm ' : '';

      if (!state[state_name].config.hasOwnProperty('firsttime') && !reset) {
        SendSkillChallengeMenu()
        state[state_name].config.firsttime = false;
      }
    };

  return {
    checkInstall,
    registerEventHandlers,
    version,
  }

})();




on('ready', () => {
  'use strict';
  SkillChallenge.checkInstall();
  SkillChallenge.registerEventHandlers();
});



