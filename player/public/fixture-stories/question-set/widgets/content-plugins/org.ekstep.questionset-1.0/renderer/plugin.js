/**
 * Plugin to create repo instance and to register repo instance
 * @extends EkstepRenderer.Plugin
 * @author sachin.kumar@goodworklabs.com>
 */
Plugin.extend({
    _type: 'org.ekstep.questionset',
    _isContainer: true,
    _render: true,
    _questionSetConfig: {},
    _questionSet: [],
    _masterQuestionSet: [],
    _renderedQuestions: [],
    _questionStates: {},
    _renderedQuestionCount: 0,
    _shuffle: undefined,
    _currentQuestion: undefined,
    _currentQuestionState: undefined,
    _constants: {
        questionPluginId: 'org.ekstep.question',
        qsParam: 'globalQuestionSet'
    },
    initPlugin: function (data) {
        debugger;
        this._masterQuestionSet = _.clone(data[this._constants.questionPluginId]);
        // If questionSet was already invoked, fetch that information from theme params
        var globalQuestionSet = Renderer.theme.getParam(this._constants.qsParam);
        if(globalQuestionSet) {
            this._currentQuestion = globalQuestionSet.currentQuestion;
            this._renderedQuestions = globalQuestionSet.renderedQuestions;
            this._questionStates = globalQuestionSet.questionStates;

            this.renderQuestion(this._currentQuestion);
            this.showCustomNextNavigation();
            if (this.getCurrentQuestionIndex() >= 1) {
                this.showCustomPrevNavigation();
            }
        } else {
            this._questionSetConfig = JSON.parse(data.config.__cdata);
            this._shuffle = JSON.parse(this._questionSetConfig.isShuffle);
            this._questionSet = _.clone(data[this._constants.questionPluginId]);
            var qobj = this.getNextQuestion();
            if (qobj) {
                //showing custom navigation for next question
                this.showCustomNextNavigation();
                //render the view of first question
                this.renderQuestion(qobj);
            } else {
                // If no questions found
                console.log('No questions found in question set.'); //DEBUG
                this.showDefaultNextNavigation();
                this.showDefaultPrevNavigation();
                OverlayManager.skipAndNavigateNext();
            }
        }
    },
    getCurrentQuestionIndex: function () {
        var instance = this;
        if(this._currentQuestion) {
            return _.findIndex(this._renderedQuestions, function (q) {
                return q.id === instance._currentQuestion.id;
            });
        } else {
            return -1;
        }
    },
    getQuestionState: function (id) {
        return this._questionStates[id];
    },
    renderQuestion: function (qobj) {
        this._renderedQuestions = _.union(this._renderedQuestions, [qobj.id]);
        this._renderedQuestionCount = this._renderedQuestions.length;
        // Save current question state before moving to next question
        this.saveCurrentQuestionState();

        // Set incoming question as current question and clear its state
        this._currentQuestion = qobj;
        this._currentQuestionState = this.getQuestionState(qobj.id); // TODO: Pass this object to questionunit renderer
        if(!qobj.rendered) this.setRendered(qobj);

        var getPluginManifest = org.ekstep.pluginframework.pluginManager.pluginObjs[qobj.pluginId];
        var unitTemplates = getPluginManifest._manifest.templates;
        var templateData = _.find(unitTemplates, function (template) {
            return template.id === qobj.templateId;
        });
        var pluginVer = (qobj.pluginVer === 1) ? '1.0' : qobj.pluginVer.toString();
        var templatePath = org.ekstep.pluginframework.pluginManager.resolvePluginResource(qobj.pluginId, pluginVer, templateData.renderer.template);
        var controllerPath = org.ekstep.pluginframework.pluginManager.resolvePluginResource(qobj.pluginId, pluginVer, templateData.renderer.controller);
        org.ekstep.service.controller.loadNgModules(templatePath, controllerPath, function() {
            setTimeout(function() {
                EkstepRendererAPI.dispatchEvent(qobj.pluginId + ":show", instance);
            }, 300);
        });
    },
    showCustomNextNavigation: function () {
        instance = this;
        var nextButton = $('.nav-next');
        nextButton.css("display", "none");
        var imageSrc = nextButton.find('img').attr("src"); //take default image path

        var img = $('<img />', {src: imageSrc, id: "show-nextcustom-navigation", class: ""}).css({
            cursor: "pointer",
            position: "absolute",
            width: "7.5%",
            top: "44%",
            right: "1%"
        });
        img.on("click", function () {
            instance.showNextQuestion();
        });
        img.appendTo('#gameArea');
    },
    showCustomPrevNavigation: function () {
        instance = this;
        var customPrevButton = $('#show-prevcustom-navigation');
        if (!customPrevButton) {
            var prevButton = $('.nav-previous');
            prevButton.hide();
            var imageSrc = prevButton.find('img').attr("src");
            var img = $('<img />', {src: imageSrc, id: "show-prevcustom-navigation", class: ""}).css({
                cursor: "pointer",
                position: "absolute",
                width: "7.5%",
                top: "44%",
                left: "1%"
            });
            img.on("click", function () {
                instance.showPrevQuestion();
            });
            img.appendTo('#gameArea');
        }
    },
    showDefaultPrevNavigation: function () {
        $("#show-prevcustom-navigation").hide();
        $('.nav-previous').show();
    },
    showDefaultNextNavigation: function () {
        $("#show-nextcustom-navigation").hide();
        $('.nav-next').show();
    },
    showPrevQuestion: function () {
        this.saveCurrentQuestionState();
        // Hide current question
        EkstepRendererAPI.dispatchEvent(this._currentQuestion.pluginId + ":hide");
        // Fetch previous question to render
        var qobj = this.getPrevQuestion();
        if (qobj) {
            EkstepRendererAPI.dispatchEvent(qobj.pluginId + ":show");
            this.renderQuestion(qobj);
            if (this.getCurrentQuestionIndex() < 1) {
                this.showDefaultPrevNavigation();
            }
        }

    },
    /**
     * renderer:questionset:show next question.
     * @event renderer:questionset:click
     * @memberof org.ekstep.questionset
     */
    showNextQuestion: function () {
        this.saveCurrentQuestionState();
        var qobj = this.getNextQuestion();
        if (qobj) {
            // Hide previous question
            EkstepRendererAPI.dispatchEvent(this._currentQuestion.pluginId + ":hide");
            //render the obj to canvas
            this.renderQuestion(qobj);
            if (this.getCurrentQuestionIndex() >= 1) {
                this.showCustomPrevNavigation();
            }
        } else {
            EkstepRendererAPI.dispatchEvent(this._currentQuestion.pluginId + ":hide");
            this.showDefaultNextNavigation();
            this.showDefaultPrevNavigation();
            //send to next stage
            OverlayManager.skipAndNavigateNext();
        }
    },
    /**
     * renderer:questionset:check shuffle question and end question
     * @event getNextQuestion
     * @fires getNextQuestion
     * @memberof org.ekstep.questionset
     */
    getNextQuestion: function () {
        var instance = this;
        //TODO: Get from _renderedQuestions
        if (this.endOfQuestions())
            return undefined;
        else if (this._shuffle) {
            return _.sample(_.omit(instance._masterQuestionSet, function (item) {
                return (typeof item.rendered === 'undefined') ? false : item.rendered;
            }));
        } else {
            return instance._questionSet.shift();
        }
    },
    getPrevQuestion: function () {
        var currentQuestionIndex = this.getCurrentQuestionIndex();
        return this._renderedQuestions[currentQuestionIndex - 1];
    },
    setRendered: function (obj) {
        var instance = this, element;
        element = _.find(instance._masterQuestionSet, function (item) {
            return item.id === obj.id;
        });
        element.rendered = true;
    },
    endOfQuestions: function () {
        return this._renderedQuestionCount == this._questionSetConfig.questionCount;
    },
    getRenderedQuestionById: function (id) {

    },
    saveCurrentQuestionState: function () {
        if(this._currentQuestion) {
            this._questionStates[this._currentQuestion.id] = this._currentQuestionState;
            var globalQuestionSet = Renderer.theme.getParam('globalQuestionSet') || {};
            globalQuestionSet.currentQuestion = this._currentQuestion;
            globalQuestionSet.renderedQuestions = this._renderedQuestions;
            globalQuestionSet.questionStates = this._questionStates;
            Renderer.theme.setParam('globalQuestionSet', globalQuestionSet);
        }
    }
});
//# sourceURL=questionSetRenderer.js