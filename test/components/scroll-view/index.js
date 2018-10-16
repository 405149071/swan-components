/**
* @license
* Copyright Baidu Inc. All Rights Reserved.
*
* This source code is licensed under the Apache License, Version 2.0; found in the
* LICENSE file in the root directory of this source tree.
*/

/**
 * @file web-view组件单测
 * @author yanghuabei@baidu.com
 */

import sinon from 'sinon';
import ScrollView from '../../../src/scroll-view';
import View from '../../../src/view';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {getComponentClass,getFactory} from '../../mock/swan-core/build-component';

const COMPONENT_NAME = 'scroll-view';
const sleep = milliseconds => {
    const start = new Date();
    let end = new Date();
    while (end - start < milliseconds) {
        end = new Date();
    }
};

/* eslint-disable max-nested-callbacks */
describe(`component [${COMPONENT_NAME}]`, () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, ScrollView);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanScrollView = $component.querySelector('swan-scroll-view');
            expect($swanScrollView).not.toBe(null);
        });

        it('should has one slot', () => {
            expect(component.slot.length).toBe(1);
        });

        describe('default props', () => {
            const defaults = [
                ['scrollX', false],
                ['scrollY', false],
                ['upperThreshold', 50],
                ['lowerThreshold', 50],
                // ['scrollTop', 0],
                // ['scrollLeft', 0],
                // ['scrollIntoView', ''],
                ['scrollWithAnimation', false],
                // ['bindscrolltoupper', undefined],
                // ['bindscrolltolower', undefined],
                // ['bindscroll', undefined]
            ];

            defaults.forEach(
                ([name, expected]) => {
                    it(`${name} default value should be ${expected}`, () => {
                        const data = component.data;
                        const actual = data.get(name);
                        expect(actual).toBe(expected);
                    });
                }
            );
        });

        describe('props watch', () => {
            let component = null;
            beforeAll(() => {
                component = buildComponent(COMPONENT_NAME, ScrollView);
                attach2Document(component);
            });

            afterAll(() => component.dispose());

            it('should scrollTop change be watched', done => {
                const scrollTopChangedSpy = sinon.spy(component, 'scrollTopChanged');
                component.data.set('scrollTop', 1);
                component.nextTick(() => {
                    expect(scrollTopChangedSpy.calledOnceWith(1)).toBe(true);
                    scrollTopChangedSpy.restore();
                    done();
                });
            });

            it('should scrollLeft change be watched', done => {
                const scrollLeftChangedSpy = sinon.spy(component, 'scrollLeftChanged');
                component.data.set('scrollLeft', 1);
                component.nextTick(() => {
                    expect(scrollLeftChangedSpy.calledOnceWith(1)).toBe(true);
                    scrollLeftChangedSpy.restore();
                    done();
                });
            });

            it('should scrollIntoView change be watched', done => {
                const scrollIntoViewChangedSpy = sinon.spy(component, 'scrollIntoViewChanged');
                component.data.set('scrollIntoView', 'view');
                component.nextTick(() => {
                    expect(scrollIntoViewChangedSpy.called).toBe(true);
                    scrollIntoViewChangedSpy.restore();
                    done();
                });
            });
        });

        describe('verify scroll event', () => {
            const ScrollViewComponent = getComponentClass(COMPONENT_NAME, ScrollView);
            const factory = getFactory();
            const contentHTML = `
                <div id="content1" style="height:300px;width:300px;background-color:green">
                    I can scroll!</div>
            `;
            const properties = {
                classProperties: {
                    superClass: View,
                    components: {
                        'scroll-view': ScrollViewComponent
                    }
                }
            };

            describe('verify horizal scroll', () => {
                factory.componentDefine(
                    'horizontal-view',
                    {
                        template: `
                            <test-view tabindex="-1">
                                <scroll-view s-ref="scrollView"
                                    scroll-left="50"
                                    scroll-x="true"
                                    style="width:100px;height:100px">
                                    ${contentHTML}
                                </scroll-view>
                            </test-view>
                        `
                    },
                    properties
                );
                const TestView = factory.getComponents('horizontal-view');
               
                let testView = null;
                let scrollView = null;
                beforeEach(() => {
                    testView = new TestView();
                    testView.attach(document.body);
                    scrollView = testView.ref('scrollView');
                });
                afterEach(() => testView.dispose());

                it('should set scroll left to be specified', done => {
                    scrollView.data.set('scrollLeft', 100);
                    scrollView.nextTick(() => {
                        expect(scrollView.main.scrollLeft).toBe(100);
                        done();
                    });
                });

                it('should scroll specify element to view', done => {
                    scrollView.data.set('scrollIntoView', 'content1');
                    scrollView.nextTick(() => {
                        scrollView.nextTick(() => {
                            expect(scrollView.main.scrollLeft).toBe(0);
                            done();
                        });
                    });
                });

                it('should scroll specify element to view use this.scrollTo', done => {
                    const scrollToSpy = sinon.spy(scrollView, 'scrollTo');
                    scrollView.data.set('scrollWithAnimation', true);
                    scrollView.data.set('scrollIntoView', 'content1');
                    scrollView.nextTick(() => {
                        scrollView.nextTick(() => {
                            expect(scrollToSpy.called).toBe(true);
                            scrollToSpy.restore();
                            done();
                        });
                    });
                });

                it('should fire bindscroll event and imgLazyLoad message when scrolled', () => {
                    const listener = sinon.spy();
                    const lazyLoadListener = sinon.spy();
                    scrollView.on('bindscroll', listener);
                    scrollView.communicator.onMessage('imgLazyLoad', lazyLoadListener);
                    scrollView.main.dispatchEvent(new UIEvent('scroll'));

                    const expectedDeltaX = -50;
                    const expectedDeltaY = 0;
                    const expectedScrollTop = 0;
                    const expectedScrollLeft = 50;
                    expect(
                        listener.calledWith(assertScrollEvent(
                            expectedDeltaX, expectedDeltaY,
                            expectedScrollTop, expectedScrollLeft
                        ))
                    ).toBe(true);
                    expect(lazyLoadListener.calledOnce).toBe(true);
                });

                it('should fire bindscrolltoupper event when scrolled', () => {
                    const listener = sinon.spy();
                    scrollView.on('bindscrolltoupper', listener);
                    scrollView.main.dispatchEvent(new UIEvent('scroll'));
                    sleep(25);
                    expect(listener.called).toBe(false);

                    scrollView.main.scrollLeft = 30;
                    scrollView.main.dispatchEvent(new UIEvent('scroll'));

                    const expectedDeltaX = 20;
                    const expectedDeltaY = 0;
                    const expectedScrollTop = 0;
                    const expectedScrollLeft = 30;
                    expect(
                        listener.calledWith(assertScrollEvent(
                            expectedDeltaX, expectedDeltaY,
                            expectedScrollTop, expectedScrollLeft
                        ))
                    ).toBe(true);
                });
            });

            describe('verify vertical scroll', () => {
                factory.componentDefine(
                    'vertical-view',
                    {
                        template: `
                            <test-view tabindex="-1">
                                <scroll-view s-ref="scrollView"
                                    scroll-top="50"
                                    scroll-y="true"
                                    style="width:100px;height:100px">
                                    ${contentHTML}
                                </scroll-view>
                            </test-view>
                        `
                    },
                    properties
                );
                const TestView = factory.getComponents('vertical-view');

                let testView = null;
                let scrollView = null;
                beforeEach(() => {
                    testView = new TestView();
                    testView.attach(document.body);
                    scrollView = testView.ref('scrollView');
                });
                afterEach(() => testView.dispose());

                it('should set scroll top to be specified', done => {
                    scrollView.data.set('scrollTop', 100);
                    scrollView.nextTick(() => {
                        expect(scrollView.main.scrollTop).toBe(100);
                        done();
                    });
                });

                it('should scroll specify element to view', done => {
                    scrollView.data.set('scrollIntoView', 'content1');
                    scrollView.nextTick(() => {
                        scrollView.nextTick(() => {
                            expect(scrollView.main.scrollTop).toBe(0);
                            done();
                        });
                    });
                });

                it('should scroll specify element to view use this.scrollTo', done => {
                    const scrollToSpy = sinon.spy(scrollView, 'scrollTo');
                    scrollView.data.set('scrollWithAnimation', true);
                    scrollView.data.set('scrollIntoView', 'content1');
                    scrollView.nextTick(() => {
                        scrollView.nextTick(() => {
                            expect(scrollToSpy.called).toBe(true);
                            scrollToSpy.restore();
                            done();
                        });
                    });
                });

                it('should fire bindscroll event when scrolled', () => {
                    const listener = sinon.spy();
                    scrollView.on('bindscroll', listener);
                    scrollView.main.dispatchEvent(new UIEvent('scroll'));

                    const expectedDeltaX = 0;
                    const expectedDeltaY = -50;
                    const expectedScrollTop = scrollView.main.scrollTop;
                    const expectedScrollLeft = 0;
                    expect(
                        listener.calledWith(assertScrollEvent(
                            expectedDeltaX, expectedDeltaY,
                            expectedScrollTop, expectedScrollLeft
                        ))
                    ).toBe(true);
                });

                it('should fire bindscrolltoupper event when scrolled', () => {
                    const listener = sinon.spy();
                    scrollView.on('bindscrolltoupper', listener);
                    scrollView.main.dispatchEvent(new UIEvent('scroll'));
                    sleep(25);
                    expect(listener.called).toBe(false);

                    scrollView.main.scrollTop = 30;
                    scrollView.main.dispatchEvent(new UIEvent('scroll'));
                    const expectedDeltaX = 0;
                    const expectedDeltaY = 20;
                    const expectedScrollTop = scrollView.main.scrollTop;
                    const expectedScrollLeft = 0;
                    expect(
                        listener.calledWith(assertScrollEvent(
                            expectedDeltaX, expectedDeltaY,
                            expectedScrollTop, expectedScrollLeft
                        ))
                    ).toBe(true);
                });
            });
        });
    });
});

function assertScrollEvent(deltaX, deltaY, scrollTop, scrollLeft) {
    return sinon.match.has(
                'detail',
                sinon.match
                    .has('deltaX', deltaX)
                    .and(sinon.match.has('deltaY', deltaY))
                    .and(sinon.match.has('scrollHeight', sinon.match.number))
                    .and(sinon.match.has('scrollWidth', sinon.match.number))
                    .and(sinon.match.has('scrollTop', scrollTop))
                    .and(sinon.match.has('scrollLeft', scrollLeft))
            )
        
}
