  var nodeTypes = [
    Element, 
    Attr,
    Text,         // All node values go in #text property. Allows for text nodes to have 
                  // attributes and inline Elements
    Comment, 
    CDATASection, // btoa encoded
  ]

  function nodeTypeConfigured(inst){
    var ret = false
    nodeTypes.forEach((i) => {if(inst instanceof i || i === inst) ret = true})
    return ret
  }

  function hasTextNode(node){
    if(node.childNodes){
      for(var n = 0; n < node.childNodes.length; n++){
        if(node.childNodes[n] instanceof Text && 
        node.childNodes[n].nodeValue.trim().length > 0)
          return true
      }
    }
    return false
  }

  function xmlTagToJson(tag){
    var text = {},
      item = null,
      inTextNodes = false;
    
    if (tag && tag.childNodes){

      if(nodeTypeConfigured(Text))
        inTextNodes = hasTextNode(tag)

      for (var n = 0; n < tag.childNodes.length; n++){
        if(nodeTypeConfigured(tag.childNodes[n])){

          if(tag.childNodes[n] instanceof Text &&
            tag.childNodes[n].nodeValue.trim().length == 0)
            continue

          if(!item)
            item = {}

          var tagName = tag.childNodes[n].tagName

          if(inTextNodes || !tagName)
            if(tag.childNodes[n] instanceof Comment ||
              tag.childNodes[n] instanceof CDATASection)
              tagName = tag.childNodes[n].nodeName
            else if(nodeTypeConfigured(Text))
              tagName = '#text'

          if(!item[tagName]){
            var prop = xmlTagToJson(tag.childNodes[n])
            item[tagName] = {}
            if(typeof prop == 'object')
              if(inTextNodes)
                Object.assign(item[tagName], prop)
              else
                Object.assign(item[tagName], prop[tag.childNodes[n].tagName])
            else if(tag.childNodes[n] instanceof CDATASection)
              item[tagName] = btoa(prop)
            else
              item[tagName] = prop 
          }
          else if(item[tagName] instanceof Array){
            var prop = xmlTagToJson(tag.childNodes[n])
            if(typeof prop == 'object')
              item[tagName].push(prop[tagName] || prop)
            else
              item[tagName].push(prop)
          }
          else{
            if(typeof item[tagName] != 'undefined'){

              if(typeof item[tagName] == 'object')
                item[tagName] = [item[tagName]]
              else
                item[tagName] = [item[tagName]]

              var prop = xmlTagToJson(tag.childNodes[n])
              if(typeof prop == 'object')
                item[tagName].push(prop[tagName] || prop)
              else
                item[tagName].push(prop)
            }
          }
        }
      }
    }

    var atVals = {}
    if(tag.attributes){
      Array.from(tag.attributes).forEach((at) => {
        atVals[at.name] = at.value
      })
    }
    
    if(!item)
      if(nodeTypeConfigured(Text))
        return tag.nodeValue || tag
      else
        return tag.textContent || tag
      
    else if(tag.tagName)
      text[tag.tagName] = item 

    if(nodeTypeConfigured(Attr))
      text[tag.tagName]['@attributes'] = atVals

    return text
  }
