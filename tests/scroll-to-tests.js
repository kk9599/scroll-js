import sinon from '../node_modules/sinon/pkg/sinon-esm.js';
import chai from 'chai';
import { scrollTo, utils, easingMap } from '../src/scroll';
import createMockRaf from 'mock-raf';

const { assert } = chai;

let mockRaf;

describe('scroll', function() {
    let dateNowStub;
    let currentTime;

    beforeEach(function() {
        mockRaf = createMockRaf();
        sinon.stub(window, 'requestAnimationFrame').callsFake(mockRaf.raf);
        dateNowStub = sinon.stub(Date, 'now');
        currentTime = 1422630923001;
        dateNowStub.onFirstCall().returns(currentTime); // set the current time for first animation frame
        currentTime += 5;
        dateNowStub.onSecondCall().returns(currentTime); // set the current animation time enough time forward to simulate a time that will trigger the last frame
        currentTime += 1000;
        dateNowStub.onThirdCall().returns(currentTime); // set the current animation time enough time forward to simulate a time that will trigger the last frame
    });

    afterEach(function() {
        window.requestAnimationFrame.restore();
        dateNowStub.restore();
    });

    it('should throw an error when attempting to scroll anything that is not a DOM element', async function() {
        return Promise.all(
            [true, false, {}].map(async testValue => {
                return await scrollTo(testValue).catch(e => {
                    assert.equal(
                        e.message,
                        `element passed to scrollTo() must be either the window or a DOM element, you passed ${testValue}!`
                    );
                });
            })
        );
    });

    it('should NOT throw an error when initializing with a value that is a DOM element', function() {
        assert.doesNotThrow(() => {
            scrollTo(document.createElement('div'));
        });
    });

    it("should update the window's scrollTop property when nothing is passed as the container", async function() {
        let innerEl = document.createElement('div');
        document.body.appendChild(innerEl);
        // inner element
        innerEl.style.height = '200vh';
        let testTo = 120;
        let scrollPromise = scrollTo(window, { top: testTo });
        mockRaf.step({ count: 3 });
        await scrollPromise;
        assert.equal(window.scrollY, testTo);
        document.body.removeChild(innerEl);
    });

    it("should update the scrolled element's scrollTop property to the same coordinate specified in the second parameter supplied to scrollTo()", async function() {
        let outerEl = document.createElement('div');
        let innerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        innerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 100;
        let testTo = 120;
        let scrollPromise = scrollTo(outerEl, { top: testTo });
        mockRaf.step({ count: 3 });
        await scrollPromise;
        assert.equal(outerEl.scrollTop, testTo);
        document.body.removeChild(outerEl);
    });

    it('scrollTo() should update document.documentElement (html element) scrollTop property if passed into scroll', function() {
        // setup element to be "scrollable"
        let bodyElement = document.createElement('div');
        bodyElement.scrollTop = 0;
        // setup documentElement to be "scrollable"
        let docEl = document.createElement('div');
        docEl.style.overflow = 'hidden';
        docEl.style.height = '150px';
        document.body.appendChild(docEl);
        let docInnerEl = document.createElement('div');
        docInnerEl.style.height = '600px';
        docEl.appendChild(docInnerEl);
        document.body.appendChild(docEl);
        let testTo = 120;
        let testDocumentElement = {
            documentElement: docEl,
            body: bodyElement
        };
        sinon.stub(utils, 'getDocument').returns(testDocumentElement);
        let scrollPromise = scrollTo(docEl, { top: testTo });
        mockRaf.step({ count: 3 });
        return scrollPromise.then(function() {
            assert.equal(docEl.scrollTop, testTo);
            utils.getDocument.restore();
            document.body.removeChild(docEl);
        });
    });

    it("should update its element's scrollTop to value supplied to scrollTo() immediately when duration 0 is used", function(done) {
        let outerEl = document.createElement('div');
        let innerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        innerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 100;
        let testTo = 120;
        scrollTo(outerEl, { top: testTo, duration: 0 });
        mockRaf.step({ count: 2 });
        setTimeout(function() {
            assert.equal(outerEl.scrollTop, testTo);
            document.body.removeChild(outerEl);
            done();
        }, 0);
    });

    it("should update its element's scrollTop to value supplied to scrollTo() immediately when behavior is set to instant", function(done) {
        let outerEl = document.createElement('div');
        let innerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        innerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 100;
        let testTo = 120;
        scrollTo(outerEl, { top: testTo, behavior: 'instant' });
        mockRaf.step({ count: 2 });
        setTimeout(function() {
            assert.equal(outerEl.scrollTop, testTo);
            document.body.removeChild(outerEl);
            done();
        }, 0);
    });

    it('should throw an error when attempting to scroll with an unsupported easing function', function() {
        const options = Object.keys(easingMap).join(',');
        const easing = 'invalidEasing';
        let outerEl = document.createElement('div');
        return scrollTo(outerEl, { easing }).catch(e => {
            assert.equal(
                e.message,
                `Scroll error: scroller does not support an easing option of "${easing}". Supported options are ${options}`
            );
        });
    });
});
