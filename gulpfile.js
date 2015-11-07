
var gulp = require('gulp');
var fs = require('fs');
var del = require('del');
var replace = require('gulp-replace');
var exec = require('child_process').exec;

var build = "./build";
var src = "./src";

var originalAuthoreaFile = build + '/Diploma Thesis.tex';
var contentFile = build + '/content.tex';
var mainTexFile = 'DP.tex';
var pdfFile = build + '/DP.pdf';

gulp.task('doc-content', function(done) {
	var fileContent = fs.readFileSync(originalAuthoreaFile, "utf8");

	var i1 = fileContent.indexOf('\n\n\n\n\n');
	var i2 = fileContent.indexOf('\\end{document}');

	var document = fileContent.substring(i1, i2);
	
	fs.writeFile(contentFile, document, function(err) {
		if(err) {
			done();
			return console.log(err);
		}

		done();
	}); 

});

gulp.task('replace', function() {
	return gulp.src(contentFile)
		.pipe(replace('\\section', '\\chapter'))
		.pipe(replace('\\subsection', '\\section'))
		.pipe(replace('\\subsubsection', '\\subsection'))
		.pipe(gulp.dest(build));
});

gulp.task('inject', function() {
	var content = fs.readFileSync(build + '/content.tex', "utf8");

	return gulp.src(build + '/DP.tex')
		.pipe(replace('%%% DOC_CONTENT %%%', content))
		.pipe(gulp.dest(build));
});

gulp.task('pdf', function(done) {
	exec('pdflatex -synctex=1 -interaction=nonstopmode ' + mainTexFile, {cwd: build}, function (err, stdout, stderr) {
		console.log(stdout);

		exec('pdflatex -synctex=1 -interaction=nonstopmode ' + mainTexFile, {cwd: build}, function (err, stdout, stderr) {
			console.log(stdout);

			exec('"' + pdfFile + '"', function (err, stdout, stderr) {
				done();
			});
		});
	});
})


gulp.task('copy', function() {
	return gulp.src(src + '/**/*')
		.pipe(gulp.dest(build));
});

gulp.task('clean-build', function(done) {
	var files = del.sync(build + '/**/*');
	done();
});

gulp.task('prepare-document', gulp.series('doc-content', 'replace'));

gulp.task('compile', gulp.series('prepare-document', 'inject', 'pdf'));

gulp.task('build', gulp.series('clean-build', 'copy', 'compile'));


gulp.task('default', 
	gulp.series('build'/*, 'show'*/)
);




