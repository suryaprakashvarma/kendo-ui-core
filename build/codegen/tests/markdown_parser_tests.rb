require 'test/unit'
require 'markdown_parser'
require 'component'

class MarkdownParserTests < Test::Unit::TestCase

    def test_parse_sets_component_name
        result = CodeGen::MarkdownParser.new.parse("# kendo.ui.AutoComplete")

        assert_equal 'kendo.ui.AutoComplete', result.name
    end

    def test_parse_option_from_configuration_section
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`
        })

        assert_equal 'foo', result.configuration[0].name
    end

    def test_parse_multiple_options
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`

### bar `Number`
        })

        assert_equal 2, result.configuration.size
    end

    def test_parse_option_type
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`
        })

        assert_equal 'String', result.configuration[0].type
    end

    def test_parse_option_description
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`
bar
        })

        assert_equal 'bar', result.configuration[0].description
    end

    def test_parse_event_from_events_section
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`

## Events

### bar
        })

        assert_equal 'bar', result.events[0].name
    end

    def test_parse_multiple_events
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`

## Events

### bar

### baz
        })

        assert_equal 2, result.events.size
    end

    def test_parse_event_description
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `String`

## Events

### bar

Bar
        })

        assert_equal 'Bar', result.events[0].description
    end

    def test_parse_nested_options
        result = CodeGen::MarkdownParser.new.parse(%{
# kendo.ui.AutoComplete

## Configuration

### foo `Object`

### foo.bar `Object`
        })

        assert_equal 'bar', result.configuration[0].configuration[0].name
    end
end
