'use strict'
const ciaIdentifier = 'cia'
const getSourceCodeLocation = require('get-source-code-location')

function locationToShortString (loc) {
  return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`
}

function getParamsStr (path) {
  return JSON.stringify(path.node.params.map((param) => {
    if (param.type === 'ObjectPattern') {
      return param.properties.map((prop) => prop.value.name)
    }
    return param.name
  })).replace(/"/g, '')
}

module.exports = function (p) {
  const t = p.types
  let code
  const returnStatement = function (path, opts) {
    const {argument} = path.node
    if (argument.type === 'MemberExpression' && argument.object.name === ciaIdentifier) {
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
  }

  const nestedTraverser = {
    ObjectMethod (fnPath, opts) {
      const params = getParamsStr(fnPath)

      let done = false
      fnPath.traverse({
        BlockStatement (blockPath) {
          if (!done) {
            done = true
            blockPath.unshiftContainer('body',
              t.memberExpression(
                t.identifier(ciaIdentifier),
                t.identifier(`method(${params}, "${locationToShortString(fnPath.node.loc)}")`)
              )
            )
          }
        },
        ReturnStatement: returnStatement
      })
    },
    ArrowFunctionExpression (fnPath) {
      const params = getParamsStr(fnPath)

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
        },
        ReturnStatement: returnStatement
      })
    },
    ReturnStatement: returnStatement
  }

  const traverser = {
    name: 'cia',
    visitor: {
      Program (path, opts) {
        code = opts.file.code
      },
      ObjectMethod (fnPath, opts) {
        const params = getParamsStr(fnPath)

        let done = false
        fnPath.traverse({
          BlockStatement (blockPath) {
            if (!done) {
              done = true
              blockPath.unshiftContainer('body',
                t.memberExpression(
                  t.identifier(ciaIdentifier),
                  t.identifier(`method(${params}, "${locationToShortString(fnPath.node.loc)}")`)
                )
              )
            }
          },
          ReturnStatement: returnStatement
        })
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
        const {argument} = path.node
        if (argument.type === 'MemberExpression' && argument.object.name === ciaIdentifier) {
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
        fnPath.traverse(nestedTraverser)
      },
      VariableDeclaration (path, opts) {
        path.traverse(nestedTraverser)
        const nodesToInsert = [
          path.node
        ]
        path.node.declarations.forEach((declaration) => {
          if (declaration.id.type === 'ObjectPattern') {
            declaration.id.properties.forEach((prop) => {
              nodesToInsert.push(t.memberExpression(
                t.identifier(ciaIdentifier),
                t.identifier(`var(${prop.value.name}, "${locationToShortString(prop.loc)}");`)
              ))
            })
          } else {
            nodesToInsert.push(t.memberExpression(
              t.identifier(ciaIdentifier),
              t.identifier(`var(${declaration.id.name}, "${locationToShortString(path.node.loc)}");`)
            ))
          }
        })
        path.replaceWithMultiple(nodesToInsert)
      },
      FunctionDeclaration (path) {
        const params = getParamsStr(path)

        let done = false
        path.traverse({
          BlockStatement (blockPath) {
            if (!done) {
              done = true
              blockPath.unshiftContainer('body',
                t.memberExpression(
                  t.identifier(ciaIdentifier),
                  t.identifier(`func(${params}, "${locationToShortString(path.node.loc)}")`)
                )
              )
            }
          }
        })
      },
      Identifier (path) {
        // console.log(path.node)
      }
    }
  }
  return traverser
}
