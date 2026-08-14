import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useEffect} from 'react';

export default function HomepageStorybookRedirect({target}: {target: string}) {
  const {siteConfig} = useDocusaurusContext();
  const href = useBaseUrl(target);

  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <main className="container margin-vert--xl">
      <h1>{siteConfig.title}</h1>
      <p>
        Redirecting to the Storybook example for <code>Presets / OrderTable</code>.
      </p>
      <p>
        If you are not redirected, open <a href={href}>{href}</a>.
      </p>
    </main>
  );
}
