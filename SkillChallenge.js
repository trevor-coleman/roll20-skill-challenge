/*
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

  const version = "0.1.4",
    script_name = 'SkillChallenge',
    state_name = 'SKILLCHALLENGE',

    //HERO_LEVELS
    LOCAL_HEROES = "localHeroes",
    HEROES_OF_THE_REALM = "heroesOfTheRealm",
    MASTERS_OF_THE_REALM = "mastersOfTheRealm",
    MASTERS_OF_THE_WORLD = "mastersOfTheWorld",

    //CHALLENGE LEVELS
    EASY_CHALLENGE = "easy",
    MODERATE_CHALLENGE = "moderate",
    HARD_CHALLENGE = "hard",

    //MENUS
    SKILL_CHALLENGE_MENU = 1,
    RANDOM_CHALLENGE_MENU = 2,
    EDIT_MENU = 3,

    //DIFFICULTY POINTS
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
          difficultyPoints: [6, 8]
        },
        moderate: {
          possibleValues: [MEDIUM, HARD],
          difficultyPoints: [10, 12],
        },

        hard: {
          possibleValues: [MEDIUM, HARD],
          difficultyPoints: [14, 20]
        }
      },
      mastersOfTheWorld: {
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
        log("Parsing ---- ")
        log(extracommand),
          log(args)
        log("---")
        switch (extracommand) {
          case 'test':
            if (!playerIsGM(msg.playerid)) return;
            sendMessage("test")
            break;
          case 'easysuccess':
            if (!playerIsGM(msg.playerid)) return;
            state[state_name].challenge.easySuccess++;
            state[state_name].challenge.easySuccess =
              state[state_name].challenge.easySuccess > state[state_name].challenge.easyTarget
                ? state[state_name].challenge.easyTarget
                : state[state_name].challenge.easySuccess;
            SendSkillChallengeMenu();
            break;
          case 'mediumsuccess':
            if (!playerIsGM(msg.playerid)) return;
            state[state_name].challenge.mediumSuccess++;
            state[state_name].challenge.mediumSuccess =
              state[state_name].challenge.mediumSuccess > state[state_name].challenge.mediumTarget
                ? state[state_name].challenge.mediumTarget
                : state[state_name].challenge.mediumSuccess;
            SendSkillChallengeMenu();
            break;
          case 'hardsuccess':
            if (!playerIsGM(msg.playerid)) return;
            state[state_name].challenge.hardSuccess++;
            state[state_name].challenge.hardSuccess =
              state[state_name].challenge.hardSuccess >= state[state_name].challenge.hardTarget
                ? state[state_name].challenge.hardTarget
                : state[state_name].challenge.hardSuccess;
            SendSkillChallengeMenu();
            break;
          case 'veryhardsuccess':
            if (!playerIsGM(msg.playerid)) return;
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
          case 'edit':
            SendEditMenu();
            break;
          case 'set':
            if (args.length) {
              SetChallengeValue(args);
            } else {
              sendMessage("Nothing to set.");
            }
            break;
          case 'random':
            if (args.length == 2) {
              let heroLevel = args.shift();
              let challengeLevel = args.shift();
              sendMessage("makeRandom - " + heroLevel + "-" + challengeLevel);
              MakeRandomChallenge(heroLevel, challengeLevel);
            }
            else {
              SendRandomChallengeMenu();
            }
            break;
          case 'start':
            SetCountsToZero();
            SendSkillChallengeMenu();
            break;
          case 'reset':
            if (!playerIsGM(msg.playerid)) return;
            SetCountsToZero();
            SendSkillChallengeMenu();
            break;
          default:
            log("default");
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

    SendEditMenu = () => {
      SetLastMenu(EDIT_MENU);
      let challenge = state[state_name].challenge;
      let editMenuString = `&{template:default} {{name=Edit Challenge}}`
        + `{{Easy Target=${challenge.easyTarget} [Change](!skillchallenge set easyTarget ?{How many easy successes?})}}`
        + `{{Medium Target=${challenge.mediumTarget} [Change](!skillchallenge set mediumTarget ?{How many medium successes?})}}`
        + `{{Hard Target=${challenge.hardTarget} [Change](!skillchallenge set hardTarget ?{How many hard successes?})}}`
        + `{{Very Hard Target=${challenge.veryHardTarget} [Change](!skillchallenge set veryHardTarget ?{How many veryHard successes?})}}`
        + `{{=[RandomChallenge](!skillchallenge random) \n [Start Challenge](!skillchallenge start)}}`;

      sendMessage(editMenuString);
    },

    SetLastMenu = menuName => {
      state[state_name].lastMenu = menuName;
    },

    SendRandomChallengeMenu = () => {
      SetLastMenu(RANDOM_CHALLENGE_MENU);
      log("===>" + state[state_name].heroLevel)

      let selectedHeroLevelString = `>>**${HeroLevelString(state[state_name].heroLevel)}**<<\n`
      let selectedChallengeLevelString = `>>**${ChallengeLevelString(state[state_name].challengeLevel)}**<<\n`

      let randomChallengeMenuString = `&{template:default} {{name=Random Challenge}}`
        + `{{Level=`
        + (state[state_name].heroLevel == LOCAL_HEROES ? selectedHeroLevelString : `[${HeroLevelString(LOCAL_HEROES)}](!skillchallenge set heroLevel ${LOCAL_HEROES})\n`)
        + (state[state_name].heroLevel == HEROES_OF_THE_REALM ? selectedHeroLevelString : `[${HeroLevelString(HEROES_OF_THE_REALM)}](!skillchallenge set heroLevel ${HEROES_OF_THE_REALM})\n`)
        + (state[state_name].heroLevel == MASTERS_OF_THE_REALM ? selectedHeroLevelString : `[${HeroLevelString(MASTERS_OF_THE_REALM)}](!skillchallenge set heroLevel ${MASTERS_OF_THE_REALM})\n`)
        + (state[state_name].heroLevel == MASTERS_OF_THE_WORLD ? selectedHeroLevelString : `[${HeroLevelString(MASTERS_OF_THE_WORLD)}](!skillchallenge set heroLevel ${MASTERS_OF_THE_WORLD})\n`)
        + `}}`
        + `{{Challenge=`
        + (state[state_name].challengeLevel == EASY_CHALLENGE ? selectedChallengeLevelString : `[${ChallengeLevelString(EASY_CHALLENGE)}](!skillchallenge set challengeLevel ${EASY_CHALLENGE})\n`)
        + (state[state_name].challengeLevel == MODERATE_CHALLENGE ? selectedChallengeLevelString : `[${ChallengeLevelString(MODERATE_CHALLENGE)}](!skillchallenge set challengeLevel ${MODERATE_CHALLENGE})\n`)
        + (state[state_name].challengeLevel == HARD_CHALLENGE ? selectedChallengeLevelString : `[${ChallengeLevelString(HARD_CHALLENGE)}](!skillchallenge set challengeLevel ${HARD_CHALLENGE})`)
        + `}}`
        + `{{[GENERATE](!skillchallenge random ${state[state_name].heroLevel} ${state[state_name].challengeLevel})=}}`;

      sendMessage(randomChallengeMenuString);

    },

    HeroLevelString = heroLevel => {
      switch (heroLevel) {
        case LOCAL_HEROES:
          return "1-5";
        case HEROES_OF_THE_REALM:
          return "6-10";
        case MASTERS_OF_THE_REALM:
          return "11-15";
        case MASTERS_OF_THE_WORLD:
          return "16-20";
        default:
          return "Not Set";
      }
    },

    ChallengeLevelString = challengeLevel => {
      switch (challengeLevel) {
        case EASY_CHALLENGE:
          return "Easy";
        case MODERATE_CHALLENGE:
          return "Moderate";
        case HARD_CHALLENGE:
          return "Hard Challenge";
        default:
          return "Not Set";
      }
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
      SetLastMenu(SKILL_CHALLENGE_MENU);

      if (!CheckIfComplete()) {
        let challenge = state[state_name].challenge

        let easyButton = challenge.easyTarget == challenge.easySuccess ? "✓" : "[✓ ](!skillchallenge easysuccess)";
        let mediumButton = "[✪](!skillchallenge mediumsuccess)";
        let hardButton = "[✪](!skillchallenge hardsuccess)";
        let veryHardButton = "[✪](!skillchallenge veryhardsuccess)";
        let failureButton = "[☠︎](!skillchallenge failure)";

        let easyRoll = "1d5cs>6cf<0+7"
        let mediumRoll = "1d5cs>6cf<0+12"
        let hardRoll = "1d5cs>6cf<0+17"
        let veryHardRoll = "1d5cs>6cf<0+22"
        let crit = "1d1cs>1cf<0*"
        let fail = "1d1cs>2*"


        //${challenge.easySuccess == challenge.easyTarget ? ">0" : ""}
        // var menu_string = `!power {{ --txcolor|#FFFFFF --bgcolor|#AD3B3B --orowbg|#FFFFFF --erowbg|#FFFFFF --name|Skill Challenge --Easy|${easySuccess} / ${easyTarget} --!buttons|[Record Easy](!skillchallenge easysuccess)}}`
        let menu_string = `&{template:default} {{name=Skill Challenge}}`
          + `{{Easy=[[${crit}${challenge.easyTarget - challenge.easySuccess}]] ${easyButton} -- **DC[[${easyRoll}]]**}}`
          + `{{Medium=[[${crit}${challenge.mediumTarget - challenge.mediumSuccess}]] ${mediumButton} -- **DC[[${mediumRoll}]]**}}`
          + `{{Hard=[[${crit}${challenge.hardTarget - challenge.hardSuccess}]] ${hardButton} -- **DC[[${hardRoll}]]**}}`
          + `{{Very Hard=[[${crit}${challenge.veryHardTarget - challenge.veryHardSuccess}]] ${veryHardButton} -- **DC[[${veryHardRoll}]]**}}`
          + `{{Failures= [[${fail}${challenge.maxFailures - challenge.failures}]] ${failureButton} -- ${challenge.failures}/${challenge.maxFailures}}}`
          + `{{Options=[Reset](!skillchallenge reset) [Edit](!skillchallenge edit) [Random](!skillchallenge random)}}`;

        sendMessage(menu_string);
      }
    },

    SendMenu = menuName => {
      log("Send Menu " + menuName)
      switch (menuName) {
        case EDIT_MENU:
          SendEditMenu();
          break;
        case RANDOM_CHALLENGE_MENU:
          SendRandomChallengeMenu();
          break;
        case SKILL_CHALLENGE_MENU:
          SendSkillChallengeMenu();
        default:
          break;
      }
    },

    SetCountsToZero = () => {
      state[state_name].challenge.easySuccess = 0;
      state[state_name].challenge.mediumSuccess = 0;
      state[state_name].challenge.hardSuccess = 0;
      state[state_name].challenge.veryhardSuccess = 0;
      state[state_name].challenge.failures = 0;
    },

    SetTargetsToZero = () => {
      state[state_name].challenge.easyTarget = 0;
      state[state_name].challenge.mediumTarget = 0;
      state[state_name].challenge.hardTarget = 0;
      state[state_name].challenge.veryHardTarget = 0;
    },

    sendMessage = (message) => {
      try {
        sendChat(script_name, whisper + message);
      } catch (error) {
        log(error)
      }
    },

    SetChallengeValue = (args) => {
      let property = args.shift()
      let value = args.shift()

      if (property == "heroLevel" || property == "challengeLevel") {
        state[state_name][property] = value;
      } else {

        state[state_name].challenge[property] = value;
      }
      log(state[state_name].lastMenu)
      SendMenu(state[state_name].lastMenu);
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
        },
        lastMenu: SKILL_CHALLENGE_MENU,
        heroLevel: LOCAL_HEROES,
        challengeLevel: MODERATE_CHALLENGE,
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
      if (!state[state_name].hasOwnProperty('lastMenu')) {
        state[state_name].lastMenu = defaults.lastMenu;
      }
      if (!state[state_name].hasOwnProperty('challengeLevel')) {
        state[state_name].challengeLevel = defaults.challengeLevel;
      }
      if (!state[state_name].hasOwnProperty('heroLevel')) {
        state[state_name].heroLevel = defaults.heroLevel;
      }

      if (!state[state_name].challenge || typeof state[state_name].challenge !== 'object') {
        state[state_name].challenge = defaults.challenge;

      }

      whisper = (state[state_name].config.sendOnlyToGM) ? '/w gm ' : '';

      if (!state[state_name].config.hasOwnProperty('firsttime') && !reset) {
        SendEditMenu();
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



