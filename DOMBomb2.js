Players = new Meteor.Collection("players");

function playerUpdateById(id, obj) {
  var player = Players.findOne({_id:id});
  if (player) {
    Players.update(player._id, { $set: obj });
  }
}

if (Meteor.isClient) {  
  function changeDetectConfigure(id, doc) {
    var insertedNodes = [];
    var observer = new WebKitMutationObserver(function(mutations) {
      var player = Players.findOne({_id:id});
      if (player) {
        Players.update(player._id, { $set: {isDirty:true} });
      }
      mutations.forEach(function(mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++)
          insertedNodes.push(mutation.addedNodes[i]);
          console.log(mutation);
      });
      console.log(insertedNodes);         
    });
    observer.observe(doc, { 
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });
  }

  var rd;

  Template.account.events({
    'click button.signUp' : function(evt) {
      rd.show();
    }
  });

  Template.account.rendered = function() {
    var editorDialog = {
      template: Template.playerEditor,
      title: "Create your CoderDojo Account!",
      buttons: {
        "cancel": {
          class: 'btn-danger',
          label: 'Cancel'
        },
        "ok": {
          closeModalOnClick: false, // if this is false, dialog doesnt close automatically on click
          class: 'btn-info',
          label: 'Ok'
        }
      }
    }

    rd = ReactiveModal.initDialog(editorDialog);

    rd.buttons.ok.on('click', function(button){
      var userName = $('#userName').val();
      var password = $('#password').val();
      var backgroundColor = $('#backgroundColor').val();
      var player = {
        userName: userName,
        password: password,
        backgroundColor: backgroundColor,
        isDirty: false,
        html: "<!doctype HTML>\n<html>\n\t<head><style>body { background: " + backgroundColor + "}</style></head>\n\t<body>\n\t\tHello, from " + userName + "\n\t</body>\n</html>"
      }
      Players.insert(player);
    });
  };

  Template.players.players = function () {
    return Players.find({}, {sort: {computerName: 1}, fields: { 'computerSecret' : 0}});
  };

  Template.player.events({
    'click button.save' : function(evt, template) {
      var playerHtml = template.find(".playerHtml");
      var document = playerHtml.contentDocument;
      var serializer = new XMLSerializer();
      var content = serializer.serializeToString(document);
      playerUpdateById(this._id, {html:content, isDirty:false});
    }
    /*,'click button.update' : function(evt, template) {
      var editor = ace.edit(this._id + "Editor");
      var code = editor.getSession().getValue();
      var playerHtml = template.find(".playerHtml");
      var iframeDoc = playerHtml.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(code);
      iframeDoc.close();    
      playerUpdateById(this._id, {html:code});
    }*/   
  });

  Template.player.helpers({
    'playerHtml': function() {
      var myIframe = $("#" + this._id + "Html");
      if (myIframe.length > 0) {
        myIframe = myIframe[0];
        var iframeDoc = myIframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(this.html);
        iframeDoc.close();
        changeDetectConfigure(this._id, iframeDoc);
      }
    }
  });

  Template.player.rendered = function() {
    var myIframe = this.find(".playerHtml");
    var iframeDoc = myIframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(this.data.html);
    iframeDoc.close();
    changeDetectConfigure(this.data._id, iframeDoc.body);
    console.log("Rendered");
  };

  Template.aceEditor.rendered = function() {    
    var editor = ace.edit(this.data._id + "Editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/html");
    editor.setHighlightActiveLine(true);
  };

  Template.aceEditor.events({
    'click button.edit': function(evt) {
      var editor = $("#" + this._id + "Editor");
      editor.show();
    },
    'click button.save': function(evt) {
      var editor = $("#" + this._id + "Editor");
      editor.show();
    }
  });  

}

var insertComputers = false;

if (Meteor.isServer) {
  Meteor.startup(function () {
    // Add startup logic if needed!
  });
}