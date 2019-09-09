if (global.GENTLY) require = GENTLY.hijack(require)

function JSONParser() {
  this.data = Buffer.from('')
  this.bytesWritten = 0
}
exports.JSONParser = JSONParser

JSONParser.prototype.initWithLength = function(length) {
  this.data = Buffer.alloc(length)
}

JSONParser.prototype.write = function(buffer) {
  if (this.data.length >= this.bytesWritten + buffer.length) {
    buffer.copy(this.data, this.bytesWritten)
  } else {
    this.data = Buffer.concat([this.data, buffer])
  }
  this.bytesWritten += buffer.length
  return buffer.length
}

JSONParser.prototype.end = function() {
  var data = this.data.toString('utf8')
  var fields
  try {
    fields = JSON.parse(data)
  } catch (e) {
    fields = Function(`try{return ${data}}catch(e){}`)() || data
  }

  if (typeof fields === 'object') {
    if (Array.isArray(fields)) {
      this.onField(false, fields)
    } else {
      for (let field in fields) {
        this.onField(field, fields[field])
      }
    }
  } else {
    this.onField(false, fields)
  }
  this.data = null

  this.onEnd()
}
