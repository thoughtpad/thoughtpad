module.exports = {
	modules: {
		development: [ 'compiler-coffeekup' ],
		production: [ 'bundler' ],
        test: []
	},
	cssbundle: {
        one: ['a', 'b'],
        two: ['c', 'd', 'e']
    },
    layouts: {
        'foo': {
            url: 'foo.html',
            layouts: {
                'bar': {
                    url: 'bar.html'
                }
            }
        },
        'too': {
            url: 'too.html'
        }
    },
    topPages: ['home'],
    pages: {
        home: {
            url: 'home.html',
            pages: [
                'one',
                'two'
            ],
            sortBy: 'number',
			publish: true
        },
        one: {
            number: 1,
            url: 'one.html',
			publish: true
        },
        two: {
            number: 3,
            url: 'two.html',
            layout: 'bar',
            index: true,
			publish: true
        }
    }
}