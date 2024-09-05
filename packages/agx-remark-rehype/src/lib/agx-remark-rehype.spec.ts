import { agxRemarkRehype } from './agx-remark-rehype';
import { visit } from 'unist-util-visit';

describe('agxRemarkRehype', () => {
  it('should return standard markdown unmodified', async () => {
    const transform = agxRemarkRehype();
    const content = await transform(standardMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });

  it('should escape characters that break Angular templates', async () => {
    const transform = agxRemarkRehype();
    const content = await transform(breakingCharactersMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });

  it('should allow embedding components without escaping', async () => {
    const transform = agxRemarkRehype();
    const content = await transform(componentMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });

  it('should allow Angular control flow syntax without escaping', async () => {
    const transform = agxRemarkRehype();
    const content = await transform(controlFlowMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });

  it('should allow supplying remark plugins', async () => {
    const transform = agxRemarkRehype({ remarkPlugins: [mockRemarkPlugin] });
    const content = await transform(standardMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });

  it('should allow supplying rehype plugins', async () => {
    const transform = agxRemarkRehype({ rehypePlugins: [mockRehypePlugin] });
    const content = await transform(standardMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });

  it('should allow supplying plugins with options', async () => {
    const transform = agxRemarkRehype({
      remarkPlugins: [[mockRemarkPluginWithOptions, { replaceWith: 'bye' }]],
    });
    const content = await transform(standardMarkdown, 'test.agx');
    expect(content).toMatchSnapshot();
  });
});

const mockRehypePlugin = () => {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'p') {
        visit(node, 'text', (childNode) => {
          childNode.value = 'hi';
        });
      }
    });
  };
};

const mockRemarkPlugin = () => {
  return (tree: any) => {
    visit(tree, 'paragraph', (node) => {
      node.children = [{ type: 'text', value: 'hi' }];
    });
  };
};

const mockRemarkPluginWithOptions = (options: any) => {
  return (tree: any) => {
    visit(tree, 'paragraph', (node) => {
      node.children = [{ type: 'text', value: options.replaceWith }];
    });
  };
};

const standardMarkdown = `
## Test
Hello
* one
* two
* three
`;

const breakingCharactersMarkdown = `
## Test
Hello
Watch out for @ characters, they upset Angular. A { can be quite scary too.
\`\`\`ts
{}
@
\`\`\`
`;

const componentMarkdown = `
## Test
Hello

<my-angular-component />
<my-angular-component></my-angular-component>
`;

const controlFlowMarkdown = `
## Test
Hello

@for(quiz of quizzes; track $index){
  <Quiz [id]="quiz.id" [questionText]="quiz.questionText" [answers]="quiz.answers" />
}
`;
