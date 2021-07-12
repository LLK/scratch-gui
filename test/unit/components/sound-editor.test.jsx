import React from 'react';
import {mountWithIntl, componentWithIntl} from '../../helpers/intl-helpers.jsx';
import SoundEditor from '../../../src/components/sound-editor/sound-editor';

describe('Sound Editor Component', () => {
    let props;
    beforeEach(() => {
        props = {
            autoCorrect: 'off',
            canUndo: true,
            canRedo: false,
            chunkLevels: [1, 2, 3],
            name: 'sound name',
            playhead: 0.5,
            trimStart: 0.2,
            trimEnd: 0.8,
            onChangeName: jest.fn(),
            onDelete: jest.fn(),
            onPlay: jest.fn(),
            onRedo: jest.fn(),
            onReverse: jest.fn(),
            onSofter: jest.fn(),
            onLouder: jest.fn(),
            onRobot: jest.fn(),
            onEcho: jest.fn(),
            onFaster: jest.fn(),
            onSlower: jest.fn(),
            onSetTrimEnd: jest.fn(),
            onSetTrimStart: jest.fn(),
            onStop: jest.fn(),
            onUndo: jest.fn()
        };
    });

    test('matches snapshot', () => {
        const component = componentWithIntl(<SoundEditor {...props} />);
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('delete button appears when selection is not null', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                trimEnd={0.75}
                trimStart={0.25}
            />
        );
        wrapper.find('[children="Delete"]').simulate('click');
        expect(props.onDelete).toHaveBeenCalled();
    });

    test('play button appears when playhead is null', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                playhead={null}
            />
        );
        wrapper.find('button[title="Play"]').simulate('click');
        expect(props.onPlay).toHaveBeenCalled();
    });

    test('stop button appears when playhead is not null', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                playhead={0.5}
            />
        );
        wrapper.find('button[title="Stop"]').simulate('click');
        expect(props.onStop).toHaveBeenCalled();
    });

    test('submitting name calls the callback', () => {
        const wrapper = mountWithIntl(
            <SoundEditor {...props} />
        );
        wrapper.find('input')
            .simulate('change', {target: {value: 'hello'}})
            .simulate('blur');
        expect(props.onChangeName).toHaveBeenCalled();
    });

    test('effect buttons call the correct callbacks', () => {
        const wrapper = mountWithIntl(
            <SoundEditor {...props} />
        );

        wrapper.find('[children="Reverse"]').simulate('click');
        expect(props.onReverse).toHaveBeenCalled();

        wrapper.find('[children="Robot"]').simulate('click');
        expect(props.onRobot).toHaveBeenCalled();

        wrapper.find('[children="Faster"]').simulate('click');
        expect(props.onFaster).toHaveBeenCalled();

        wrapper.find('[children="Slower"]').simulate('click');
        expect(props.onSlower).toHaveBeenCalled();

        wrapper.find('[children="Louder"]').simulate('click');
        expect(props.onLouder).toHaveBeenCalled();

        wrapper.find('[children="Softer"]').simulate('click');
        expect(props.onSofter).toHaveBeenCalled();
    });

    test('undo and redo buttons can be disabled by canUndo/canRedo', () => {
        let wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                canUndo
                canRedo={false}
            />
        );
        expect(wrapper.find('button[title="Undo"]').prop('disabled')).toBe(false);
        expect(wrapper.find('button[title="Redo"]').prop('disabled')).toBe(true);

        wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                canRedo
                canUndo={false}
            />
        );
        expect(wrapper.find('button[title="Undo"]').prop('disabled')).toBe(true);
        expect(wrapper.find('button[title="Redo"]').prop('disabled')).toBe(false);
    });

    test.skip('undo/redo buttons call the correct callback', () => {
        const wrapper = mountWithIntl(
            <SoundEditor
                {...props}
                canRedo
                canUndo
            />
        );
        wrapper.find('button[title="Undo"]').simulate('click');
        expect(props.onUndo).toHaveBeenCalled();

        wrapper.find('button[title="Redo"]').simulate('click');
        expect(props.onRedo).toHaveBeenCalled();
    });
});
