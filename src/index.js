'use strict'
const ciaIdentifier = 'cia'
const getSourceCodeLocation = require('get-source-code-location')

function locationToShortString (loc) {
  return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`
}

module.exports = function (p) {
  // console.log(p.options)
  const t = p.types
  let code
  return {
    name: 'cia',
    visitor: {
      Program (path, opts) {
        code = opts.file.code
      },
      AssignmentExpression (path) {
        // console.log(path.node)
        path.insertAfter(
          t.memberExpression(
            t.identifier(ciaIdentifier),
            t.identifier(`var(${path.node.left.name}, "${locationToShortString(path.node.loc)}");`)
          )
        )
      },
      UpdateExpression (path) {
        path.insertAfter(
          t.memberExpression(
            t.identifier(ciaIdentifier),
            t.identifier(`var(${path.node.argument.name}, "${locationToShortString(path.node.argument.loc)}");`)
          )
        )
      },
      ReturnStatement (path, opts) {
        // console.log(opts)
        const {argument} = path.node
        if (argument.type === 'MemberExpression' && argument.object.name === 'cia') {
          return
        }
        const {loc} = argument
        const argString = getSourceCodeLocation(code, loc)
        path.replaceWith(
          t.returnStatement(
            t.memberExpression(
              t.identifier(ciaIdentifier),
              t.identifier(`return(${argString}, "${locationToShortString(loc)}");`)
            )
          )
        )
      },
      FunctionDeclaration (fnPath) {
        let done = false
        const blacklist = ['MemberExpression', 'FunctionDeclaration', 'BlockStatement', 'Identifier']
        fnPath.traverse({
          enter (path) {
            if (blacklist.indexOf(path.node.type) !== -1) {
              return
            }
            if (!done) {
              done = true
              const params = JSON.stringify(fnPath.node.params.map((param) => {
                return param.name
              })).replace(/"/g, '')

              path.insertBefore(
                t.memberExpression(
                  t.identifier(ciaIdentifier),
                  t.identifier(`func(${params}, "${locationToShortString(fnPath.node.id.loc)}")`)
                )
              )
            }
          }
        })
      },
      VariableDeclaration (path, opts) {
        const nodesToInsert = [
          path.node
        ]
        path.node.declarations.forEach((declaration) => {
          nodesToInsert.push(t.memberExpression(
            t.identifier(ciaIdentifier),
            t.identifier(`var(${declaration.id.name}, "${locationToShortString(path.node.loc)}");`)
          ))
        })
        path.replaceWithMultiple(nodesToInsert)
      },
      // FunctionDeclaration (path) {
      //   console.log(path)
      // },
      Identifier (path) {
        // console.log(path.node)
      }
    }
  }
}
