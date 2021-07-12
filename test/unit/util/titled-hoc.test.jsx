import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import TitledHOC from '../../../src/lib/titled-hoc.jsx';

jest.mock('react-ga');

describe('TitledHOC', () => {
    const mockStore = configureStore();
    let store;

    beforeEach(() => {
        store = mockStore({
            scratchGui: {
                projectState: {}
            }
        });
    });

    test('when a new title is set within GUI, it calls onUpdateProjectTitle', () => {
        const Component = () => (<div />);
        const WrappedComponent = TitledHOC(Component);
        const mockOnUpdateProjectTitle = jest.fn();
        const mounted = mountWithIntl(
            <WrappedComponent
                onUpdateProjectTitle={mockOnUpdateProjectTitle}
                projectTitle="existing title"
                store={store}
            />
        );
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
        mounted.setProps({
            reduxProjectTitle: 'new title'
        });
        expect(mockOnUpdateProjectTitle).toHaveBeenCalled();
        expect(mockOnUpdateProjectTitle.mock.calls[0][0]).toBe('new title');
    });

    test('when new title is set in GUI but external title is unset, it does not call onUpdateProjectTitle', () => {
        const Component = () => (<div />);
        const WrappedComponent = TitledHOC(Component);
        const mockOnUpdateProjectTitle = jest.fn();
        const mounted = mountWithIntl(
            <WrappedComponent
                onUpdateProjectTitle={mockOnUpdateProjectTitle}
                store={store}
            />
        );
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
        mounted.setProps({
            reduxProjectTitle: 'new title'
        });
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
    });

    test('when new title is set in GUI but external title is null, it does not call onUpdateProjectTitle', () => {
        const Component = () => (<div />);
        const WrappedComponent = TitledHOC(Component);
        const mockOnUpdateProjectTitle = jest.fn();
        const mounted = mountWithIntl(
            <WrappedComponent
                onUpdateProjectTitle={mockOnUpdateProjectTitle}
                projectTitle={null}
                store={store}
            />
        );
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
        mounted.setProps({
            reduxProjectTitle: 'new title'
        });
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
    });

    test('when new title is set in GUI and external title is blank, it does call onUpdateProjectTitle', () => {
        const Component = () => (<div />);
        const WrappedComponent = TitledHOC(Component);
        const mockOnUpdateProjectTitle = jest.fn();
        const mounted = mountWithIntl(
            <WrappedComponent
                onUpdateProjectTitle={mockOnUpdateProjectTitle}
                projectTitle=""
                store={store}
            />
        );
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
        mounted.setProps({
            reduxProjectTitle: 'new title'
        });
        expect(mockOnUpdateProjectTitle).toHaveBeenCalled();
        expect(mockOnUpdateProjectTitle.mock.calls[0][0]).toBe('new title');
    });

    test('when title is erased in GUI and made blank, it does call onUpdateProjectTitle', () => {
        const Component = () => (<div />);
        const WrappedComponent = TitledHOC(Component);
        const mockOnUpdateProjectTitle = jest.fn();
        const mounted = mountWithIntl(
            <WrappedComponent
                onUpdateProjectTitle={mockOnUpdateProjectTitle}
                projectTitle="existing title"
                store={store}
            />
        );
        expect(mockOnUpdateProjectTitle).not.toHaveBeenCalled();
        mounted.setProps({
            reduxProjectTitle: ''
        });
        expect(mockOnUpdateProjectTitle).toHaveBeenCalled();
        expect(mockOnUpdateProjectTitle.mock.calls[0][0]).toBe('');
    });
});
