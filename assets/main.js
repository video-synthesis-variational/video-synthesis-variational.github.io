// Generic function to handle all expandable content
function toggleExpandable(button) {
    const targetId = button.getAttribute('data-target');
    const content = document.getElementById(targetId);
    const expandText = button.getAttribute('data-expand-text') || 'Expand results';
    const hideText = button.getAttribute('data-hide-text') || 'Hide results';
    
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        button.textContent = expandText;
    } else {
        content.classList.add('show');
        button.textContent = hideText;
    }
}

// 智能视频播放控制 - 50%可见时暂停
function setupSmartVideoPlayback() {
    const videos = document.querySelectorAll('video');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // 50%可见时播放，50%以下暂停
    };
    
    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            const video = entry.target;
            const visibleRatio = entry.intersectionRatio;
            
            if (visibleRatio >= 0.5) {
                // 50%以上可见 - 播放
                if (video.paused && video.readyState >= 2) {
                    video.play().catch(e => console.log('播放失败:', e));
                }
            } else {
                // 50%以下可见 - 暂停
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    };
    
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    videos.forEach(video => {
        video.muted = true;
        video.loop = true;
        video.preload = 'metadata';
        video.setAttribute('playsinline', '');
        
        // 特殊处理：如果是第一个示例（dog-balloon）中的视频，使用更激进的播放策略
        const isFirstExample = video.closest('#dog-balloon');
        if (isFirstExample) {
            // 为第一个示例使用更激进的播放策略
            const forcePlay = () => {
                if (video.paused && video.readyState >= 2) {
                    video.play().catch(e => console.log('第一个示例视频播放失败:', e));
                }
            };
            
            // 立即尝试播放
            forcePlay();
            
            // 监听视频事件，确保播放
            video.addEventListener('loadedmetadata', forcePlay);
            video.addEventListener('loadeddata', forcePlay);
            video.addEventListener('canplay', forcePlay);
            video.addEventListener('canplaythrough', forcePlay);
            
            // 延迟重试
            setTimeout(forcePlay, 500);
            setTimeout(forcePlay, 1000);
        } else {
            observer.observe(video);
        }
    });
}

// 延迟加载视频源
function setupLazyVideoLoading() {
    const videos = document.querySelectorAll('video[data-src]');
    
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                const dataSrc = video.getAttribute('data-src');
                
                if (dataSrc && !video.src) {
                    video.src = dataSrc;
                    video.load();
                }
                
                lazyObserver.unobserve(video);
            }
        });
    }, { threshold: 0.1 });
    
    videos.forEach(video => {
        lazyObserver.observe(video);
    });
}

// 完整的视频优化系统
function setupOptimizedVideoSystem() {
    setupSmartVideoPlaybackWithFirstExampleFix();
    setupLazyVideoLoading();
}

// 智能视频播放控制 - 修复第一个示例问题
function setupSmartVideoPlaybackWithFirstExampleFix() {
    const videos = document.querySelectorAll('video');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // 50%可见时播放，50%以下暂停
    };
    
    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            const video = entry.target;
            const visibleRatio = entry.intersectionRatio;
            
            if (visibleRatio >= 0.5) {
                // 50%以上可见 - 播放
                if (video.paused && video.readyState >= 2) {
                    video.play().catch(e => console.log('播放失败:', e));
                }
            } else {
                // 50%以下可见 - 暂停
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    };
    
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    videos.forEach(video => {
        video.muted = true;
        video.loop = true;
        video.preload = 'metadata';
        video.setAttribute('playsinline', '');
        
        // 特殊处理：如果是第一个示例（dog-balloon）中的视频
        const isFirstExample = video.closest('#dog-balloon');
        if (isFirstExample) {
            // 为第一个示例使用更激进的播放策略，但保留暂停功能
            const forcePlay = () => {
                if (video.paused && video.readyState >= 2) {
                    video.play().catch(e => console.log('第一个示例视频播放失败:', e));
                }
            };
            
            // 立即尝试播放
            forcePlay();
            
            // 监听视频事件，确保播放
            video.addEventListener('loadedmetadata', forcePlay);
            video.addEventListener('loadeddata', forcePlay);
            video.addEventListener('canplay', forcePlay);
            video.addEventListener('canplaythrough', forcePlay);
            
            // 延迟重试
            setTimeout(forcePlay, 500);
            setTimeout(forcePlay, 1000);
            
            // 仍然使用 Intersection Observer，但使用更宽松的阈值
            const firstExampleObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    const visibleRatio = entry.intersectionRatio;
                    
                    if (visibleRatio >= 0.1) { // 10%可见就播放
                        if (video.paused && video.readyState >= 2) {
                            video.play().catch(e => console.log('第一个示例视频播放失败:', e));
                        }
                    } else {
                        if (!video.paused) {
                            video.pause();
                        }
                    }
                });
            }, { threshold: 0.1 });
            
            firstExampleObserver.observe(video);
        } else {
            // 其他视频使用正常的 Intersection Observer
            observer.observe(video);
        }
    });
}

// 视频自动循环播放设置
function setupVideoAutoplay() {
    const videos = document.querySelectorAll('video');
    
    if (videos.length === 0) return;
    
    console.log(`设置 ${videos.length} 个视频的自动循环播放`);
    
    videos.forEach((video, index) => {
        // 确保所有必要的属性都已设置
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.setAttribute('playsinline', '');
        
        // 强制播放函数
        const forcePlay = () => {
            if (video.paused) {
                video.play().then(() => {
                    console.log(`视频 ${index + 1} 开始播放`);
                }).catch(e => {
                    console.log(`视频 ${index + 1} 自动播放失败:`, e);
                    // 延迟重试
                    setTimeout(() => {
                        video.play().catch(err => console.log(`视频 ${index + 1} 重试失败:`, err));
                    }, 500);
                });
            }
        };
        
        // 立即尝试播放
        forcePlay();
        
        // 监听视频事件，确保播放
        video.addEventListener('loadedmetadata', forcePlay);
        video.addEventListener('loadeddata', forcePlay);
        video.addEventListener('canplay', forcePlay);
        video.addEventListener('canplaythrough', forcePlay);
        
        // 监听视频结束事件，确保循环播放
        video.addEventListener('ended', () => {
            video.currentTime = 0;
            video.play().catch(e => console.log('循环播放失败:', e));
        });
    });
    
    // 使用 Intersection Observer 优化性能
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            
            if (entry.isIntersecting) {
                // 视频进入视口时播放
                if (video.paused) {
                    video.play().catch(e => console.log('可见视频自动播放失败:', e));
                }
            } else {
                // 视频离开视口时暂停（可选）
                // 注释掉暂停逻辑，让所有视频都保持播放
                // if (!video.paused) {
                //     video.pause();
                // }
            }
        });
    }, {
        threshold: 0.1, // 10% 可见时开始播放
        rootMargin: '50px' // 提前50px开始播放
    });

    // 观察所有视频
    videos.forEach(video => observer.observe(video));
    
    // 延迟重试机制
    setTimeout(() => {
        videos.forEach(video => {
            if (video.paused) {
                video.play().catch(e => console.log('延迟自动播放失败:', e));
            }
        });
    }, 1000);
    
    // 定期检查并重新启动暂停的视频
    setInterval(() => {
        videos.forEach(video => {
            if (video.paused && video.readyState >= 2) { // 至少已加载元数据
                video.play().catch(e => console.log('定期检查播放失败:', e));
            }
        });
    }, 3000); // 每3秒检查一次
}

// 处理可展开内容中的视频
function setupExpandableVideoHandling() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-expandable')) {
            const targetId = e.target.getAttribute('data-target');
            const content = document.getElementById(targetId);
            
            if (!content.classList.contains('show')) {
                // 内容展开时，确保新显示的视频也能自动播放
                setTimeout(() => {
                    const newVideos = content.querySelectorAll('video');
                    newVideos.forEach(video => {
                        video.muted = true;
                        video.loop = true;
                        video.autoplay = true;
                        video.setAttribute('autoplay', '');
                        video.setAttribute('muted', '');
                        video.setAttribute('loop', '');
                        video.setAttribute('playsinline', '');
                        
                        if (video.paused) {
                            video.play().catch(e => console.log('展开内容视频播放失败:', e));
                        }
                    });
                }, 100);
            }
        }
    });
}

// 比较功能 - 修改为支持多个区域
function setupComparisonButtons() {
    const buttons = document.querySelectorAll('.comparison-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前按钮所属的section
            const section = this.getAttribute('data-section');
            
            // 找到同一section的所有按钮
            const sectionButtons = document.querySelectorAll(`[data-section="${section}"]`);
            
            // 移除同一section中所有按钮的激活状态
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加激活状态到点击的按钮
            this.classList.add('active');
            
            // 获取视频源和标签
            const videoSrc = this.getAttribute('data-video');
            const label = this.getAttribute('data-label');
            
            // 找到对应的比较显示区域
            const comparisonDisplay = document.getElementById(`comparison-display-${section}`);
            const oursVideo = document.getElementById(`ours-video-${section}`);
            const baselineVideo = document.getElementById(`baseline-video-${section}`);
            const baselineLabel = document.getElementById(`baseline-label-${section}`);
            
            if (comparisonDisplay && oursVideo && baselineVideo && baselineLabel) {
                // 更新基线视频
                baselineVideo.src = videoSrc + '#t=0.001';
                baselineLabel.textContent = label;
                
                // 显示比较显示区域
                comparisonDisplay.style.display = 'block';
            }
        });
    });
}

// 视频控制按钮功能
function setupVideoControlButtons() {
    const buttons = document.querySelectorAll('.video-control-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const targetVideoId = this.getAttribute('data-video-target');
            const videoSrc = this.getAttribute('data-video-src');
            const videoLabel = this.getAttribute('data-video-label') || 'Video';
            
            // 找到目标视频元素
            const targetVideo = document.getElementById(targetVideoId);
            const targetLabel = document.getElementById(targetVideoId + '-label');
            
            if (targetVideo && videoSrc) {
                // 更新视频源
                targetVideo.src = videoSrc + '#t=0.001';
                
                // 更新标签
                if (targetLabel) {
                    targetLabel.textContent = videoLabel;
                }
                
                // 确保视频播放
                targetVideo.load();
                targetVideo.play().catch(e => console.log('视频播放失败:', e));
                
                // 切换按钮状态
                this.classList.toggle('active');
                
                // 如果按钮有data-group属性，则处理同组按钮
                const group = this.getAttribute('data-group');
                if (group) {
                    const groupButtons = document.querySelectorAll(`[data-group="${group}"]`);
                    groupButtons.forEach(btn => {
                        if (btn !== this) {
                            btn.classList.remove('active');
                        }
                    });
                }
            }
        });
    });
}

// 简单视频切换功能
function setupSimpleVideoButtons() {
    const buttons = document.querySelectorAll('.simple-video-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取视频源和目标视频ID
            const videoSrc = this.getAttribute('data-video-src');
            const targetVideoId = this.getAttribute('data-target-video');
            
            // 找到目标视频元素
            const targetVideo = document.getElementById(targetVideoId);
            
            if (targetVideo && videoSrc) {
                // 更新视频源
                targetVideo.src = videoSrc + '#t=0.001';
                
                // 确保视频重新加载并播放
                targetVideo.load();
                targetVideo.play().catch(e => console.log('简单视频播放失败:', e));
                
                // 处理同组按钮的激活状态
                const group = this.getAttribute('data-group');
                if (group) {
                    // 移除同组中所有按钮的激活状态
                    const groupButtons = document.querySelectorAll(`[data-group="${group}"]`);
                    groupButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // 激活当前按钮
                    this.classList.add('active');
                } else {
                    // 如果没有组，直接切换当前按钮状态
                    this.classList.toggle('active');
                }
            }
        });
    });
}

// 编辑按钮功能 - 专门处理Video Editing部分的按钮
function setupEditingButtons() {
    const buttons = document.querySelectorAll('.editing-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取视频源和目标视频ID
            const videoSrc = this.getAttribute('data-video-src');
            const targetVideoId = this.getAttribute('data-target-video');
            const group = this.getAttribute('data-group');
            
            // 找到目标视频元素
            const targetVideo = document.getElementById(targetVideoId);
            
            if (targetVideo && videoSrc) {
                // 更新视频源
                targetVideo.src = videoSrc + '#t=0.001';
                
                // 确保视频重新加载并播放
                targetVideo.load();
                targetVideo.play().catch(e => console.log('编辑视频播放失败:', e));
                
                // 处理同组按钮的激活状态
                if (group) {
                    // 移除同组中所有按钮的激活状态
                    const groupButtons = document.querySelectorAll(`[data-group="${group}"]`);
                    groupButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // 激活当前按钮
                    this.classList.add('active');
                } else {
                    // 如果没有组，直接切换当前按钮状态
                    this.classList.toggle('active');
                }
            }
        });
    });
}

// 主事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 处理可展开内容的点击事件
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-expandable')) {
            const targetId = e.target.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const expandText = e.target.getAttribute('data-expand-text') || 'Expand results';
            const hideText = e.target.getAttribute('data-hide-text') || 'Hide results';
            
            if (content.classList.contains('show')) {
                content.classList.remove('show');
                e.target.textContent = expandText;
            } else {
                content.classList.add('show');
                e.target.textContent = hideText;
            }
        }
    });

    // 设置优化的视频系统
    setupOptimizedVideoSystem();
    
    // 设置可展开内容中的视频处理
    setupExpandableVideoHandling();
    
    // 设置比较按钮
    setupComparisonButtons();

    // 设置视频控制按钮
    setupVideoControlButtons();

    // 设置简单视频切换按钮
    setupSimpleVideoButtons();

    // 设置编辑按钮
    setupEditingButtons();

    setupExampleIndex();
}); 

// 示例索引切换功能 - 修改为支持不同的按钮组
function setupExampleIndex() {
    // 处理第一个按钮组（Variational Inference）
    const indexButtons = document.querySelectorAll('.index-btn:not(.physics-btn):not(.baseline-btn):not(.long-video-btn):not(.edit-video-btn)');
    const exampleContents = document.querySelectorAll('.example-content:not([id^="physics-"]):not([id^="baseline-"]):not([id^="long-"]):not([id^="edit-"])');
    
    indexButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetExample = this.getAttribute('data-example');
            
            // 移除第一个按钮组中所有按钮的激活状态
            indexButtons.forEach(btn => btn.classList.remove('active'));
            
            // 激活当前按钮
            this.classList.add('active');
            
            // 隐藏第一个按钮组的所有示例内容
            exampleContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 显示选中的示例内容
            const targetContent = document.getElementById(targetExample);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 确保新显示的内容中的视频也能自动播放
                setTimeout(() => {
                    const videos = targetContent.querySelectorAll('video');
                    videos.forEach(video => {
                        video.muted = true;
                        video.loop = true;
                        video.autoplay = true;
                        video.setAttribute('autoplay', '');
                        video.setAttribute('muted', '');
                        video.setAttribute('loop', '');
                        video.setAttribute('playsinline', '');
                        
                        if (video.paused) {
                            video.play().catch(e => console.log('示例切换后视频播放失败:', e));
                        }
                    });
                }, 100);
            }
        });
    });
    
    // 处理第二个按钮组（Physics-Simulator Instructions）
    const physicsButtons = document.querySelectorAll('.physics-btn');
    const physicsContents = document.querySelectorAll('.example-content[id^="physics-"]');
    
    physicsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetExample = this.getAttribute('data-example');
            
            // 移除第二个按钮组中所有按钮的激活状态
            physicsButtons.forEach(btn => btn.classList.remove('active'));
            
            // 激活当前按钮
            this.classList.add('active');
            
            // 隐藏第二个按钮组的所有示例内容
            physicsContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 显示选中的示例内容
            const targetContent = document.getElementById(targetExample);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 确保新显示的内容中的视频也能自动播放
                setTimeout(() => {
                    const videos = targetContent.querySelectorAll('video');
                    videos.forEach(video => {
                        video.muted = true;
                        video.loop = true;
                        video.autoplay = true;
                        video.setAttribute('autoplay', '');
                        video.setAttribute('muted', '');
                        video.setAttribute('loop', '');
                        video.setAttribute('playsinline', '');
                        
                        if (video.paused) {
                            video.play().catch(e => console.log('物理示例切换后视频播放失败:', e));
                        }
                    });
                }, 100);
            }
        });
    });
    
    // 处理第三个按钮组（Comparisons with Baselines）
    const baselineButtons = document.querySelectorAll('.baseline-btn');
    const baselineContents = document.querySelectorAll('.example-content[id^="baseline-"]');
    
    baselineButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetExample = this.getAttribute('data-example');
            
            // 移除第三个按钮组中所有按钮的激活状态
            baselineButtons.forEach(btn => btn.classList.remove('active'));
            
            // 激活当前按钮
            this.classList.add('active');
            
            // 隐藏第三个按钮组的所有示例内容
            baselineContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 显示选中的示例内容
            const targetContent = document.getElementById(targetExample);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 确保新显示的内容中的视频也能自动播放
                setTimeout(() => {
                    const videos = targetContent.querySelectorAll('video');
                    videos.forEach(video => {
                        video.muted = true;
                        video.loop = true;
                        video.autoplay = true;
                        video.setAttribute('autoplay', '');
                        video.setAttribute('muted', '');
                        video.setAttribute('loop', '');
                        video.setAttribute('playsinline', '');
                        
                        if (video.paused) {
                            video.play().catch(e => console.log('基线示例切换后视频播放失败:', e));
                        }
                    });
                }, 100);
            }
        });
    });
    
    // 处理第四个按钮组（Long Video Extension）
    const longVideoButtons = document.querySelectorAll('.long-video-btn');
    const longVideoContents = document.querySelectorAll('.example-content[id^="long-"]');
    
    longVideoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetExample = this.getAttribute('data-example');
            
            // 移除第四个按钮组中所有按钮的激活状态
            longVideoButtons.forEach(btn => btn.classList.remove('active'));
            
            // 激活当前按钮
            this.classList.add('active');
            
            // 隐藏第四个按钮组的所有示例内容
            longVideoContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 显示选中的示例内容
            const targetContent = document.getElementById(targetExample);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 确保新显示的内容中的视频也能自动播放
                setTimeout(() => {
                    const videos = targetContent.querySelectorAll('video');
                    videos.forEach(video => {
                        video.muted = true;
                        video.loop = true;
                        video.autoplay = true;
                        video.setAttribute('autoplay', '');
                        video.setAttribute('muted', '');
                        video.setAttribute('loop', '');
                        video.setAttribute('playsinline', '');
                        
                        if (video.paused) {
                            video.play().catch(e => console.log('长视频示例切换后视频播放失败:', e));
                        }
                    });
                }, 100);
            }
        });
    });

    // 处理第五个按钮组（Video Editing）
    const editVideoButtons = document.querySelectorAll('.edit-video-btn');
    const editVideoContents = document.querySelectorAll('.example-content[id^="edit-"]');
    
    editVideoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetExample = this.getAttribute('data-example');
            
            // 移除第五个按钮组中所有按钮的激活状态
            editVideoButtons.forEach(btn => btn.classList.remove('active'));
            
            // 激活当前按钮
            this.classList.add('active');
            
            // 隐藏第五个按钮组的所有示例内容
            editVideoContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 显示选中的示例内容
            const targetContent = document.getElementById(targetExample);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 确保新显示的内容中的视频也能自动播放
                setTimeout(() => {
                    const videos = targetContent.querySelectorAll('video');
                    videos.forEach(video => {
                        video.muted = true;
                        video.loop = true;
                        video.autoplay = true;
                        video.setAttribute('autoplay', '');
                        video.setAttribute('muted', '');
                        video.setAttribute('loop', '');
                        video.setAttribute('playsinline', '');
                        
                        if (video.paused) {
                            video.play().catch(e => console.log('视频编辑示例切换后视频播放失败:', e));
                        }
                    });
                }, 100);
            }
        });
    });
}

// BibTeX functionality
function setupBibTeX() {
    const copyBtn = document.getElementById('bibtex-copy');
    const bibtexText = document.getElementById('bibtex-text');
    
    if (!copyBtn || !bibtexText) return;
    
    // Copy BibTeX to clipboard
    copyBtn.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(bibtexText.textContent);
            
            // Visual feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy BibTeX: ', err);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexText.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                
                // Visual feedback
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed: ', fallbackErr);
                alert('Failed to copy BibTeX. Please select and copy manually.');
            }
            document.body.removeChild(textArea);
        }
    });
}

// Initialize BibTeX functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupBibTeX();
});