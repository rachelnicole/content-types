'use strict';

const nunjucks = require('nunjucks');

// const sass = require('node-sass');

/**
 *  TODO: Use the actual renderer in here
 */
nunjucks.configure({ autoescape: true });

module.exports = function pluginTests(test, plugin) {
  let validation = [];
  let inputs = [];

  if (!test) {
    return 'you must include a test runner';
  }
  if (!plugin) {
    return 'you must include a plugin to test';
  }
  if (typeof plugin !== 'object') {
    return 'plugin must be an object';
  }

  // console.log(plugin);

  test('Required core keys available', t => {
    t.true(plugin.hasOwnProperty('html'), 'HTML is included');
    t.true(plugin.hasOwnProperty('inputs'), 'Inputs are included');
    t.true(plugin.hasOwnProperty('validation'), 'Validation is included');
    t.true(plugin.hasOwnProperty('name'), 'Input has a name');
    t.true(plugin.hasOwnProperty('description'), 'Input has a description');
  });

  test('Validation configured correctly', t => {
    validation = Object.keys(plugin.validation);

    t.true(validation.length > 0, 'There is at least one validation function');

    validation.map(func => {
      t.true(typeof plugin.validation[func] === 'function', 'All validation functions are run-able functions');

      return func;
    });
  });

  test('Inputs configured correctly', t => {
    inputs = Object.keys(plugin.inputs);

    t.true(inputs.length > 0, 'There is at least one input');

    inputs.map(input => {
      const imp = plugin.inputs[input];

      // Validation
      t.true(imp.hasOwnProperty('validation'), 'Input has validation');
      t.true(typeof imp.validation === 'object', 'Validation is an object');

      // Validation Function
      t.true(imp.validation.hasOwnProperty('function'), 'Input validation has a `function` property');
      t.true(validation.indexOf(imp.validation.function) >= 0, 'Input validation function exists in the plugin\'s validation list');

      // Validation On
      t.true(imp.validation.hasOwnProperty('on'), 'Input validation has an `on` property');
      t.true(typeof imp.validation.on === 'string', 'Input validation on is a string');

      // Label
      t.true(imp.hasOwnProperty('label'), 'Input has a `label` property');
      t.true(typeof imp.label === 'string', 'Input label is a string');

      // Type
      t.true(imp.hasOwnProperty('type'), 'Input has a `type` property');
      t.true(typeof imp.type === 'string', 'Input type is a string');

      return input;
    });
  });

  test('HTML is written correctly, includes required attributes, and is render-able', t => {
    const htmls = [
      {
        tag: 'label',
        prop: 'for',
        key: 'id',
        message: 'Label exists and contains the input\'s ID',
      },
      {
        tag: 'input',
        prop: 'id',
        key: 'id',
        message: 'Input exists and contains its ID',
      },
      {
        tag: 'input',
        prop: 'type',
        key: 'type',
        message: 'Input exists and contains its type',
      },
      {
        tag: 'input',
        prop: 'value',
        key: 'value',
        message: 'Input exists and contains its value',
      },
      {
        tag: 'input',
        prop: 'name',
        key: 'name',
        message: 'Input exists and contains its name',
      },
    ];
    let inputTests = [];
    let labelTests = [];

    // Make sure tests are a string
    t.true(typeof plugin.html === 'string', 'HTML is a string');

    // Try and render it
    const rendered = nunjucks.renderString(plugin.html, {});
    t.true(typeof rendered === 'string', 'HTML must be a render-able by nunjucks');

    inputTests = inputs.map(input => {
      return htmls.map(tst => {
        let htmlRegex;
        const thisTest = tst;

        // textarea
        if (plugin.inputs[input].type === 'textarea') {
          if (thisTest.prop === 'type') {
            return {};
          }
          if (thisTest.tag !== 'label') {
            thisTest.tag = 'textarea';
          }
          if (thisTest.prop === 'value') {
            htmlRegex = new RegExp(`<textarea.*>{{\\s*${input}.value\\s*}}<\/textarea>`);
          }
        }

        if (plugin.inputs[input].type === 'select') {
          if ((thisTest.prop === 'type') || (thisTest.prop === 'value')) {
            return {};
          }
          if (thisTest.tag !== 'label') {
            thisTest.tag = 'select';
          }
        }

        htmlRegex = htmlRegex || new RegExp(`<${thisTest.tag}[a-zA-Z\\=\\"\\{\\}\\s\\-\\_\\|\\.\\(\\)\\%\\']*(${thisTest.prop}=['"]\\s*{{\\s*${input}.${thisTest.key}\\s*}}\\s*['"])`);

        return {
          regex: htmlRegex,
          message: `${thisTest.message} [${input}]`,
        };
      });
    });

    labelTests = inputs.map(input => {
      const labelRegex = new RegExp(`<label[a-zA-Z\\=\\"\\{\\}\\s\\-\\_\\|\\.\\(\\)\\%\\']*for=['"]\\s*{{\\s*${input}.id\\s*}}[a-zA-Z\\=\\"\\{\\}\\s\\-\\_\\|\\.\\(\\)\\%\\']*>[\\w\\W\\s]*({{\\s*${input}.label\\s*}})[\\w\\W\\s]*(?=<\/label)`);

      return {
        regex: labelRegex,
        message: 'Label is included for and inside the label tag' + ` [${input}]`,
      };
    });

    inputTests = [].concat.apply([], inputTests);
    inputTests = inputTests.concat(labelTests);

    inputTests = inputTests.filter(tst => {
      if (!tst) {
        return false;
      }

      return true;
    });

    // Regex test all of the htmls we need
    inputTests.map(tst => {
      if (tst.regex) {
        t.regex(plugin.html, tst.regex, tst.message);
      }
    });
  });


  // test('npm-based Javascript should be a string or array', t => {
  //   if (plugin.hasOwnProperty('javascript') && plugin.javascript.hasOwnProperty('npm')) {
  //     let validated = false;
  //     if (typeof (plugin.javascript.npm) === 'string' || Array.isArray(plugin.javascript.npm)) {
  //       validated = true;
  //     }
  //     t.ok(validated, 'if local Javascript exists, it must be a string or array');
  //   }
  // });

  // test('local Javascript should be a string or array', t => {
  //   if (plugin.hasOwnProperty('javascript') && plugin.javascript.hasOwnProperty('local')) {
  //     let validated = false;
  //     if (typeof (plugin.javascript.local) === 'string' || Array.isArray(plugin.javascript.local)) {
  //       validated = true;
  //     }
  //     t.ok(validated, 'if UX Javascript exists, it must be a string or array');
  //   }
  // });

  // test.cb('UX Styling must be a actual css', t => {
  //   if (plugin.hasOwnProperty('styling')) {
  //     let validated = false;
  //     const renderedVars = nunjucks.renderString(plugin.styling, plugin);
  //     sass.render({
  //       data: renderedVars
  //       },
  //       function(err, result) {
  //         if (!err) {
  //           validated = true;
  //         }
  //         t.ok(validated, 'UX styling must be CSS');
  //         t.end();
  //       }
  //     );
  //   }
  //   else {
  //     t.end();
  //   }
  // });

  return plugin;
};
