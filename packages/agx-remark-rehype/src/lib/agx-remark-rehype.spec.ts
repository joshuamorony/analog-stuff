import { agxRemarkRehype } from './agx-remark-rehype';

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

  it('should allow embedding components without escaping', () => {});

  it('should allow Angular control flow syntax without escaping', () => {});

  it('should allow supplying remark plugins', () => {});

  it('should allow supplying rehype plugins', () => {});
});

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
