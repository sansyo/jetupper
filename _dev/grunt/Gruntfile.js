var path = require('path');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var folderMount = function folderMount(connect, point) {
    return connect.static(path.resolve(point));
};

module.exports = function(grunt) {

    // パッケージファイルの指定
    var pkg = grunt.file.readJSON('package.json');

    // タスクのロード
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // パスの設定
    var pathConfig = {
        // テンプレート表示ローカルサーバー
        devVH: 'hyde-dev',
        // 表示テストサーバー
        distVH: 'hyde',
        // 本番サーバー
        url: '',
        // ルート位置
        root: '../../',
        // ベーステンプレート開発ディレクトリ
        baseDir: 'template',
        // ジキルソースディレクトリ
        sourceDir: 'source',
        // デプロイディレクトリ
        deployDir: 'deploy',
        // 共通リソースの配置先
        src: 'assets',
        // FTP ホスト
        ftpHost: '',
        // FTP パス
        ftp: ''
    };

    grunt.initConfig({

        // パス設定のロード
        // ---------------------------------------------------
        path: pathConfig,

        // サーバースタート
        // ---------------------------------------------------
        connect: {
            server: {
                options: {
                    port: 9001,
                    middleware: function(connect, options) {
                        return [lrSnippet, folderMount(connect, '.')];
                    }
                }
            }
        },

        // ページオープン
        // ---------------------------------------------------
        open: {
            dev: {
                path: 'http://<%= path.devVH %>/'
            },
            dist: {
                path: 'http://<%= path.distVH %>/'
            },
            deploy: {
                path: '<%= path.url %>'
            }
        },

        // ファイルの監視
        // ---------------------------------------------------
        watch: {
            options: {
                livereload: true,
                nospawn: true
            },
            html: {
                files: [
                    '<%= path.root %><%= path.baseDir %>/**/*.html'
                ],
                tasks: []
            },
            sass: {
                files: '../sass/**/*.scss',
                tasks: ['sass:dev']
            },
            jekyll: {
                files: [
                    '<%= path.root %><%= path.sourceDir %>/**/*.md',
                    '<%= path.root %><%= path.sourceDir %>/**/*.html'
                ],
                tasks: ['exec:build']
            }
        },

        // Sass のコンパイル
        // ---------------------------------------------------
        sass: {
            dev: {
                options: {
                    style: 'expanded'
                },
                files: {
                    '<%= path.root %><%= path.baseDir %>/<%= path.src %>/css/base.css': '../sass/base.scss'
                }
            },
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    '<%= path.root %><%= path.sourceDir %>/<%= path.src %>/css/base.css': '../sass/base.scss'
                }
            }
        },

        // JS ファイル圧縮
        // ---------------------------------------------------
        uglify: {
            dev: {
                files: {
                    '<%= path.root %><%= path.baseDir %>/<%= path.src %>/js/run.min.js': '../js/run.js'
                }
            },
            dist: {
                files: {
                    '<%= path.root %><%= path.sourceDir %>/<%= path.src %>/js/run.min.js': '../js/run.js'
                }
            }
        },

        // HTML 圧縮
        // ---------------------------------------------------
        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeComments: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= path.root %><%= path.deployDir %>',
                    src: '**/*.html',
                    dest: '<%= path.root %><%= path.deployDir %>'
                }]
            }
        },

        // Jekyll の実行
        // ---------------------------------------------------
        exec: {
            build: {
                cmd: 'jekyll build'
            }
        },

        // 初期ディレクトリ作成
        // ---------------------------------------------------
        mkdir: {
            prepare: {
                options: {
                    create: [
                        '<%= path.root %><%= path.baseDir %>/<%= path.src %>/css',
                        '<%= path.root %><%= path.baseDir %>/<%= path.src %>/img',
                        '<%= path.root %><%= path.baseDir %>/<%= path.src %>/js',
                        '<%= path.root %><%= path.sourceDir %>/_layouts',
                        '<%= path.root %><%= path.sourceDir %>/_includes',
                        '<%= path.root %><%= path.sourceDir %>/_posts',
                    ]
                }
            }
        },

        // 素材ディレクトリの共通ファイルをコピー前にいったん削除
        // ---------------------------------------------------
        clean: {
            prepare: {
                options: {
                    force: true // 強制的に上位ディレクトリを削除
                },
                src: [
                    '<%= path.root %>/.git',
                    '<%= path.root %>/.gitignore',
                    '<%= path.root %>/README.md'
                ]
            },
            build: {
                options: {
                    force: true // 上位ディレクトリのファイルを強制削除
                },
                src: [
                    '<%= path.root %><%= path.sourceDir %><%= path.src %>'
                ]
            }
        },

        // 開発ディレクトリのファイルをビルド素材ディレクトリにコピー
        // ---------------------------------------------------
        copy: {
            build: {
                files: [{
                    expand: true,
                    cwd: '<%= path.root %><%= path.baseDir %><%= path.src %>',
                    src: ['**'],
                    dest: '<%= path.root %><%= path.sourceDir %><%= path.src %>'
                }]
            }
        },

        // Bower のディレクトリ管理
        // ---------------------------------------------------
        bower: {
            install: {
                options: {
                    targetDir: '<%= path.root %><%= path.baseDir %>/<%= path.src %>',
                    layout: 'byType',
                    install: true,
                    cleanBowerDir: true
                }
            }
        },

        // FTP アップロード
        // ---------------------------------------------------
        'ftp-deploy': {
            deploy: {
                auth: {
                    host: '<%= path.ftpHost %>',
                    port: '21',
                    authKey: 'key1'
                },
                src: '<%= path.root %><%= path.deployDir %>',
                dest: '<%= path.ftp %>',
                exclusions: [
                    '<%= path.root %>/**/.DS_Store',
                    '<%= path.root %>/**/Thumb.db'
                ]
            }
        }

    });

    // 初期ディレクトリ構築
    grunt.registerTask('prepare', [
        'mkdir:prepare',
        'sass:dev',
        'bower:install',
        // 'clean:prepare'
    ]);

    // ベーステンプレート開発
    grunt.registerTask('base', [
        'connect',
        'sass:dev',
        'uglify:dev',
        'open:dev',
        'watch'
    ]);

    // ジキルテンプレート開発＆記事執筆
    grunt.registerTask('build', [
        'connect',
        'sass:dev',
        'uglify:dev',
        // 'open:dist',
        'watch:jekyll'
    ]);

    // デプロイ
    grunt.registerTask('deploy', [
        'clean:dist',
        'sass:dist',
        'uglify:dist',
        'copy:dist',
        'exec:build',
        'htmlmin:dist',
        'ftp-deploy:deploy'
    ]);

};