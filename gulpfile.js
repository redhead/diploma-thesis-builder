
var gulp = require('gulp');
var fs = require('fs');
var del = require('del');
var replace = require('gulp-replace');
var iff = require('gulp-if');
var exec = require('child_process').exec;

var build = "./build";
var print = "./print";
var src = "./src";

var originalAuthoreaFile = '/Diploma Thesis.tex';
var contentFile = '/content.tex';
var mainTexFile = 'DP';
var pdfFile = '/DP.pdf';

function createTasks(_, folder, options) {

	function gulptask(name, task) {
		return gulp.task(name + _, task);
	}

	function gulpseries() {
		var names = [];
		[].slice.call(arguments).forEach(function(name) {
			names.push(name + _);
		});
		return gulp.series.apply(gulp, names);
	}
	
	gulptask('doc-content', function(done) {
		var fileContent = fs.readFileSync(folder + originalAuthoreaFile, "utf8");

		var i1 = fileContent.indexOf('\n\n\n\n\n');
		var i2 = fileContent.indexOf('\\bibliography{');

		if (i2 == -1) {
			i2 = fileContent.indexOf('\\end{document}');
		}

		var document = fileContent.substring(i1, i2);
		
		fs.writeFile(folder + contentFile, document, function(err) {
			if(err) {
				done();
				return console.log(err);
			}

			done();
		}); 
	});

	gulptask('replace', function() {
		return gulp.src(folder + contentFile)
			.pipe(replace('\\section', '\\chapter'))
			.pipe(replace('\\subsection', '\\section'))
			.pipe(replace('\\subsubsection', '\\subsection'))
			.pipe(replace(/\s---\s/g, '---'))
			.pipe(replace(/(figures\/([^\/]+)\/([^\/]+)caption\{[^\}]+)/g, '$1\\label{$2}'))
			.pipe(gulp.dest(folder));
	});

	gulptask('inject', function() {
		var content = fs.readFileSync(folder + '/content.tex', "utf8");

		return gulp.src(folder + '/DP.tex')
			.pipe(replace('%%% DOC_CONTENT %%%', content))
			.pipe(iff(!options.links, replace('colorlinks=true', 'colorlinks=false')))
			.pipe(iff(options.zadani, replace('%\\pagenumbering', '\\pagenumbering')))
			.pipe(iff(options.zadani, replace('%\\includepdf{zadani.pdf}', '\\includepdf{zadani.pdf}')))
			.pipe(gulp.dest(folder));
	});

	gulptask('pdf', function(done) {
		exec('pdflatex -synctex=1 -interaction=nonstopmode ' + mainTexFile, {cwd: folder}, function (err, stdout, stderr) {
		exec('bibtex ' + mainTexFile, {cwd: folder}, function (err, stdout, stderr) {
		exec('pdflatex -synctex=1 -interaction=nonstopmode ' + mainTexFile, {cwd: folder}, function (err, stdout, stderr) {
		exec('pdflatex -synctex=1 -interaction=nonstopmode ' + mainTexFile, {cwd: folder}, function (err, stdout, stderr) {
			done();
		});
		});
		});
		});
	})


	gulptask('show', function(done) {
		exec('"' + folder + pdfFile + '"', function (err, stdout, stderr) {
			done();
		});
	})


	gulptask('copy', function() {
		return gulp.src(src + '/**/*')
			.pipe(gulp.dest(folder));
	});

	gulptask('clean-build', function(done) {
		var files = del.sync(folder + '/**/*');
		done();
	});

	gulptask('prepare-document', gulpseries('doc-content', 'replace'));

	gulptask('compile', gulpseries('prepare-document', 'inject', 'pdf'));

	gulptask('build', gulpseries('clean-build', 'copy', 'compile'));

}

createTasks('_pdf', build, {links: true, zadani: true});
createTasks('_print', print, {links: false, zadani: false});

gulp.task('default', gulp.parallel(
		gulp.series('build_pdf', 'show_pdf'),
		gulp.series('build_print')
	)
);




