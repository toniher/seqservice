<?xml version='1.0'  encoding="ISO-8859-1" ?>
<xsl:stylesheet
    xmlns:xsl='http://www.w3.org/1999/XSL/Transform'
    version='1.0'
    >

<xsl:output method="text"/>

<xsl:param name="db" >blastdb</xsl:param>
<xsl:param name="id" ></xsl:param>
<xsl:param name="ref" ></xsl:param>
<xsl:param name="seqtype" >nucl</xsl:param>
<xsl:param name="maxiters" >1</xsl:param>
<xsl:param name="username" >Anonymous</xsl:param>
<xsl:param name="date" ></xsl:param>


<xsl:template match="/">
<xsl:apply-templates select="BlastOutput"/>
</xsl:template>

<xsl:template match="BlastOutput">{
	"_id":"<xsl:value-of select="$id" />",
	"type":"blast",
	"ref":"<xsl:value-of select="$ref" />",
	"db":"<xsl:value-of select="$db"/>",<!-- db:<xsl:apply-templates select="BlastOutput_db" mode="text"/>, -->
	"program":"<xsl:apply-templates select="BlastOutput_program" mode="text"/>",<!--     name:<xsl:apply-templates select="BlastOutput_query-def" mode="text"/>, -->
	"seqtype":"<xsl:value-of select="$seqtype" />",
	"maxiters":"<xsl:value-of select="$maxiters" />",
	"username":"<xsl:value-of select="$username" />",
	"date":"<xsl:value-of select="$date" />",
	<xsl:apply-templates select="BlastOutput_param/Parameters"/>,
	"results": [ 
			{
				"iters":[ <xsl:for-each select="BlastOutput_iterations/Iteration">
					<xsl:if test="position()!=1">,</xsl:if>
					<xsl:apply-templates select="."/>
					</xsl:for-each>
				],
				"length":<xsl:apply-templates select="BlastOutput_query-len"/>,
				"def":"<xsl:apply-templates select="BlastOutput_query-def"/>"
			} 
		]
}</xsl:template>

<xsl:template match="Parameters">"params": {
		"expect":<xsl:apply-templates select="Parameters_expect" />,
		"gap_open":<xsl:apply-templates select="Parameters_gap-open"/>,
		"gap_extend":<xsl:apply-templates select="Parameters_gap-extend"/>,
		"filter":"<xsl:apply-templates select="Parameters_filter" mode="text"/>"
	}</xsl:template>


<!-- Iteration -->
<xsl:template match="Iteration">
				{
				"num":<xsl:apply-templates select="Iteration_iter-num" />,
				"hits":[
					<xsl:for-each select="Iteration_hits/Hit">
						<xsl:if test="position()!=1">,</xsl:if>
						<xsl:apply-templates select="."/>
					</xsl:for-each>
				]
				}
</xsl:template>


<!-- Hit -->
<xsl:template match="Hit">{
					"num":<xsl:apply-templates select="Hit_num"/>,
					"def":"<xsl:apply-templates select="Hit_def"/>",
					"id":"<xsl:apply-templates select="Hit_id"/>",
					"length": <xsl:apply-templates select="Hit_len" />,
					"hsps":[
						<xsl:for-each select="Hit_hsps/Hsp">
						<xsl:if test="position()!=1">,</xsl:if>
						<xsl:apply-templates select="."/>
						</xsl:for-each>
					]
					}
</xsl:template>

<xsl:template match="Hsp">{
						"num":<xsl:apply-templates select="Hsp_num" />,
						"bit_score":<xsl:apply-templates select="Hsp_bit-score" />,
						"score":<xsl:apply-templates select="Hsp_score" />,
						"evalue":<xsl:apply-templates select="Hsp_evalue" />,
						"qstart":<xsl:apply-templates select="Hsp_query-from" />,
						"qend":<xsl:apply-templates select="Hsp_query-to" />,
						"hstart":<xsl:apply-templates select="Hsp_hit-from" />,
						"hend":<xsl:apply-templates select="Hsp_hit-to" />,
						"query_frame":<xsl:apply-templates select="Hsp_query-frame" />,
						"hit_frame":<xsl:apply-templates select="Hsp_hit-frame" />,
						"identity":<xsl:apply-templates select="Hsp_identity" />,
						"positive":<xsl:apply-templates select="Hsp_positive" />,
						"gaps":<xsl:apply-templates select="Hsp_gaps" />,
						"length":<xsl:apply-templates select="Hsp_align-len" />,
						"qseq":"<xsl:apply-templates select="Hsp_qseq" mode="text"/>",
						"midline":"<xsl:apply-templates select="Hsp_midline" mode="text"/>",
						"hseq":"<xsl:apply-templates select="Hsp_hseq" mode="text"/>"
						}
</xsl:template>


<!--  <xsl:template match="*" mode="text">-->
<!--     <xsl:call-template name="escape">-->
<!--       <xsl:with-param name="pStr" select="."/>-->
<!--     </xsl:call-template>-->
<!--   </xsl:template>-->

<!--    <xsl:template name="escape">-->
<!--     <xsl:param name="pStr" select="."/>-->
<!--     <xsl:param name="pspecChars">/|&amp;{}#@~\"</xsl:param>-->

<!--     <xsl:if test="string-length($pStr)">-->
<!--         <xsl:variable name="vchar1" select="substring($pStr,1,1)"/>-->

<!--          <xsl:variable name="vEscaping" select=-->
<!--           "substring('&quot;', 1 div contains($pspecChars, $vchar1))-->
<!--           "/>-->

<!--          <xsl:value-of select=-->
<!--          "concat($vEscaping, $vchar1, $vEscaping)"/>-->

<!--          <xsl:call-template name="escape">-->
<!--           <xsl:with-param name="pStr" select="substring($pStr,2)"/>-->
<!--           <xsl:with-param name="pspecChars" select="$pspecChars"/>-->
<!--          </xsl:call-template>-->
<!--      </xsl:if>-->
<!--    </xsl:template>-->



  <xsl:template match="text()" name="escape-quot">
    <xsl:param name="s" select="."/>
    <xsl:choose>
      <xsl:when test="contains($s,'&quot;')">
        <xsl:variable name="sL" 
          select="substring-before($s,'&quot;')"/>
        <xsl:variable name="sR" 
          select="substring-after($s,'&quot;')"/>
        <xsl:value-of select="$sL"/>
        <xsl:text>&amp;quot;</xsl:text>
        <xsl:call-template name="escape-quot">
          <xsl:with-param name="s" select="$sR"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$s"/>
      </xsl:otherwise>
    </xsl:choose>    
  </xsl:template>


<!--<xsl:template match="*" mode="text">-->
<!--<xsl:text>&quot;</xsl:text>-->
<!--<xsl:call-template name="escape">-->
<!--<xsl:with-param name="s" select="."/>-->
<!--</xsl:call-template>-->
<!--<xsl:text>&quot;</xsl:text>-->
<!--</xsl:template>-->

<!--<xsl:template name="escape">-->
<!--<xsl:param name="s"/>-->
<!--  <xsl:choose>-->
<!--        <xsl:when test="contains($s,'&quot;')">-->
<!--                <xsl:value-of select="substring-before($s,'&quot;')"/>-->
<!--                <xsl:text>\"</xsl:text>-->
<!--                <xsl:call-template name="escape">-->
<!--                        <xsl:with-param name="s" select="substring-after($s,'&quot;')"/>-->
<!--                </xsl:call-template>-->
<!--        </xsl:when>-->
<!--        <xsl:otherwise>-->
<!--                <xsl:value-of select='$s'/>-->
<!--        </xsl:otherwise>-->
<!--  </xsl:choose>-->
<!--</xsl:template>-->

</xsl:stylesheet>
