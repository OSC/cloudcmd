var initTree = function(treeroot){
  // var self = this;
  // not sure how to style yet as icon: "mini-icon directory" works...
  // but doesn't
  jQuery12('#directory-tree').jstree({
      'core' : {
        'multiple' : false,
        'data' : {
          url: function(node){
            console.log(node);
            if(node.id == "#")
              return CloudCmd.PREFIX_URL + "/fs" + treeroot;
            else
              return CloudCmd.PREFIX_URL + "/fs" + node.id;
          },
          dataFilter: function(data, type){
            var parsed_data = JSON.parse(data);
            return JSON.stringify(parsed_data.files.filter(function(arg){
                return (! arg.name.startsWith(".")) && arg.size == "dir";
            }).map(function(arg){
                //FIXME:
                // how do we know if it is a leaf node? we do not :-(
                // solution - we need to have a CUSTOM request that actually
                // returns whether or not the directory CONTAINS any subdirectories
                // THUS our own request/response in front of the api request/response
                // but this works well now...
                return {text: arg.name, children: true, id: parsed_data.path + arg.name}; // add id or attribute for full path
            }));
          }
        }
      }
  });
};

// Event handler activates on page load
jQuery12('body').on('panel_initialized', function(e){
    document.getElementById("checkbox-dotfiles").checked = ( getCookie('dotfiles') === 'true' );
    dotfiles();
    document.getElementById("checkbox-ownermode").checked = ( getCookie('ownermode') === 'true' );
    ownerMode();
});

// Event handler activates after the panel update
jQuery12('body').on('panel_dir_updated', function(e){
    document.getElementById("checkbox-dotfiles").checked = ( getCookie('dotfiles') === 'true' );
    dotfiles();
    document.getElementById("checkbox-ownermode").checked = ( getCookie('ownermode') === 'true' );
    ownerMode();
});

var load_directory = function(dir){
  CloudCmd.loadDir({
    path: dir,
    isRefresh: false,
    panel: DOM.getByDataName('js-left')
  });
}

jQuery12('#directory-tree').on('changed.jstree', function(e, data){
  // NOTE: this will be called when calling refresh on the tree because
  // refresh does a deselect_all - so we only call load_directory if a directory
  // is specified

  //TODO: may have to massage data.node.id
  // in lib/client/listeners.js this was done:
  //
  // link        = link.replace('%%', '%25%');
  // link        = decodeURI(link);
  // link        = link.replace(RegExp('^' + prefix + fs), '') || '/';
  if(data && data.node && data.node.id){
    load_directory(data.node.id);
  }
});

jQuery12('.directory-explorer .home a').click(function(e){
    load_directory(jQuery12(this).attr('href'))
    e.preventDefault();
    return false;
});

var updateTreeSelection = function(){
  var tree = jQuery12('#directory-tree').jstree(true),
      dir  = DOM.getCurrentDirPath().slice(0,-1),
      home = jQuery12('.directory-explorer .home a');

  tree.deselect_all(true);
  home.parent().removeClass('selected');

  if(dir === home.attr('href')){
    home.parent().addClass("selected");
  }
  else{
    tree.select_node(dir, true);
  }
};

var refreshTree = function(){
  var tree = jQuery12('#directory-tree').jstree(true);

  // first remove selection so we can call refresh
  // refresh does a deselect_all and then reselects; and when it does that we
  // catch that above in the changed.jstree event - which would cause an
  // unnecessary loading of the panel!
  // so by deselecting now, jstree won't try to re-select so we can re-select
  // manually without firing those changed.jstree events in updateTreeSelection
  tree.deselect_all(true);

  // reload tree (and children)
  // FIXME: hopefully this is fast enough that we don't need to show the loading screen
  // currently not showing it
  tree.refresh(true);
}

jQuery12('#directory-tree').on('refresh.jstree', function(){
  updateTreeSelection();
});

jQuery12('#directory-tree').on('ready.jstree', function(){
    updateTreeSelection();
});

// in client.js in the "createFileTable" function we trigger an event
// on the panel after updating the panel's current directory
// here we update the tree selection accordingly
jQuery12('body').on('panel_dir_updated', function(e){
    updateTreeSelection();
});

jQuery12('body').on('tree_refresh_needed', function(e){
    refreshTree();
});

