describe ViewText, '.escape' do
  it 'decodes stored entities before escaping, so they are not escaped twice' do
    expect(ViewText.escape('Tom &amp; Jerry')).to eq 'Tom &amp; Jerry'
    expect(ViewText.escape('Tom & Jerry')).to eq 'Tom &amp; Jerry'
  end

  it 'escapes markup and both quotes' do
    expect(ViewText.escape(%q(<b>"x" 'y'</b>))).to eq '&lt;b&gt;&quot;x&quot; &#39;y&#39;&lt;/b&gt;'
  end

  it 'escapes markup hidden in an entity' do
    expect(ViewText.escape('&lt;script&gt;')).to eq '&lt;script&gt;'
  end

  it 'turns numbers and nil into strings' do
    expect(ViewText.escape(2001)).to eq '2001'
    expect(ViewText.escape(nil)).to eq ''
  end
end
