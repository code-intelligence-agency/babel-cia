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
  const traverser = {
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
      Function (fnPath) {
        const params = JSON.stringify(fnPath.node.params.map((param) => {
          return param.name
        })).replace(/"/g, '')

        let done = false
        fnPath.traverse({
          BlockStatement (blockPath) {
            if (!done) {
              done = true
              blockPath.unshiftContainer('body',
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
        path.traverse({
          ArrowFunctionExpression (fnPath) {
            const params = JSON.stringify(fnPath.node.params.map((param) => {
              return param.name
            })).replace(/"/g, '')

            let done = false
            fnPath.traverse({
              BlockStatement (blockPath) {
                if (!done) {
                  done = true
                  blockPath.unshiftContainer('body',
                    t.memberExpression(
                      t.identifier(ciaIdentifier),
                      t.identifier(`func(${params}, "${locationToShortString(fnPath.node.loc)}")`)
                    )
                  )
                }
              }
            })
          }
        })
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
  return traverser
}
